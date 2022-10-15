import { Types, AptosClient } from 'aptos'
import { createRef, useEffect, useState } from 'react';
import './App.css';

const client = new AptosClient('https://fullnode.devnet.aptoslabs.com/v1')

function App() {
  const [address, setAddress] = useState<string | null>(null)
  useEffect(() => {
    initializeAptos()
  }, [])
  
  const [account, setAccount] = useState<Types.AccountData | null>(null)
  useEffect(() => {
    if (!address) return;
    client.getAccount(address).then(setAccount)
  }, [address])

  const [modules, setModules] = useState<Types.MoveModuleBytecode[]>([])
  useEffect(()=> {
    if (!address) return
    client.getAccountModules(address).then(setModules)
  }, [address])

  const hasModule = modules.some((m) => m.abi?.name === 'message')
  const publishInstructions = (
    <pre>
      Run this command to publish the module:
      <br />
      aptos move publish --package-dir /path/to/hello_blockchain/ --named-addresses hello_blockchain={address}
    </pre>
  )

  const initializeAptos = async () => {
    if (!window.aptos.isConnected()) {
      await window.aptos.connect()
      if (window.aptos.isConnected()) {
        if (urlAddress) {
          setAddress(urlAddress)
        } else {
          window.aptos.account().then((data: {address: string}) => setAddress(data.address))
        }
      }
    } else {
      if (urlAddress) {
        setAddress(urlAddress)
      } else {
        window.aptos.account().then((data: {address: string}) => setAddress(data.address))
      }
    }
  }

  // function stringToHex(text: string) {
  //   const encoder = new TextEncoder()
  //   const encoded = encoder.encode(text)

  //   return Array.from(encoded, (i) => i.toString(16).padStart(2, "0")).join("")
  // }

  const ref= createRef<HTMLTextAreaElement>()
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit =async (e: any) => {
    e.preventDefault()
    if (!ref.current) return

    const message = ref.current.value
    // console.log('stringToHex(message) is: ', stringToHex(message))
    const transaction = {
      type: "entry_function_payload",
      function: `${address}::message::set_message`,
      // arguments: [stringToHex(message)],
      arguments: [message],
      type_arguments: [],
    }

    try {
      setIsSaving(true)
      await window.aptos.signAndSubmitTransaction(transaction)
    } finally {
      setIsSaving(false)
    }
  }

  const [resources, setResources] = useState<Types.MoveResource[]>([])
  useEffect(() => {
    if (!address) return
    client.getAccountResources(address).then(setResources)
  }, [address])
  const resourceType = `${address}::message::MessageHolder`
  const resource = resources.find((r) => r.type === resourceType)
  const data = resource?.data as {message: string} | undefined
  const message = data?.message

  const urlAddress = window.location.pathname.slice(1)
  const isEditable = !urlAddress

  return (
    <div className="App">
      {/* <p><code>{ address }</code></p>
      <p><code>{ account?.sequence_number }</code></p> */}
      {hasModule ? (
        <form onSubmit={handleSubmit}>
          <textarea ref={ref} defaultValue={message} readOnly={!isEditable} />
          {isEditable && (<input disabled={isSaving} type="submit" />)}
          {isEditable && (<a href={address!}>Get public URL</a>)}
        </form>
      ) : publishInstructions}
    </div>
  );
}

export default App;
