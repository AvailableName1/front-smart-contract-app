import { ethers } from "ethers";
import * as React from "react";
import "./App.css";
import abi from "./utils/WavePortal.json";

export default function App() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [count, setCount] = React.useState(null);
  const [txnHash, setTxnHash] = React.useState("");
  const [connectedAccount, setConnectedAccount] = React.useState("");
  const [allWaves, setAllWaves] = React.useState([]);
  const [waveMessage, setWaveMessage] = React.useState("");
  const contractAddress = "0x1D1c7eF7b0Ee869d263bAD2004178C973d94e893";
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const waves = await wavePortalContract.getAllWaves();
        let wavesFormatted = [];
        waves.forEach((wave) => {
          wavesFormatted.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });
        setAllWaves(wavesFormatted);
      } else {
        console.log("no metamask");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const checkIfWalletConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask");
      } else {
        console.log("window has eth object injected", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found authed acc", account);
        setConnectedAccount(account);
        getAllWaves();
      } else {
        console.log("no authed accs");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        throw new Error("get MetaMask");
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setConnectedAccount(accounts[0]);
    } catch (e) {
      console.log(e);
    }
  };

  const wave = async (message) => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        let interactedCount = await wavePortalContract.getWhoInteracted();
        console.log("Retrieved total wave count...", count.toNumber());
        console.log(`${interactedCount} interacted`);

        setIsLoading(true);
        const waveTxn = await wavePortalContract.wave(message);
        console.log("Processing...", waveTxn.hash);

        await waveTxn.wait().then(() => {
          setIsLoading(false);
          setTxnHash(waveTxn.hash);
          setWaveMessage("");
        });
        console.log("Done -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        interactedCount = await wavePortalContract.getWhoInteracted();
        console.log("Retrieved total wave count...", count.toNumber());
        console.log(`${interactedCount.length} interacted`);
      } else {
        console.log("eth object doesnt exist in window");
      }
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  React.useEffect(() => {
    checkIfWalletConnected();
  }, [txnHash]);

  React.useEffect(() => {
    async function getNumberWaves() {
      try {
        const { ethereum } = window;
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
          );
          await wavePortalContract.getTotalWaves().then((waves) => {
            setCount(waves.toNumber());
          });
        } else {
          console.log("no wallet");
        }
      } catch (e) {
        console.log(e);
      }
    }
    getNumberWaves();
  }, [contractABI, txnHash]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (waveMessage) {
      wave(waveMessage);
    } else {
      alert("please enter some message");
    }
  };

  return (
    <div className='mainContainer'>
      <div className='dataContainer'>
        <div className='header'>
          <span aria-label='wave emoji' role='img'>
            👋
          </span>{" "}
          Hey there!
        </div>

        <div className='bio'>
          Connect wallet, type in message and wave for now, then we will think
          about mint...
        </div>
        <div>
          <p>Number of total waves with the contract: {count}</p>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <textarea
            disabled={isLoading}
            value={waveMessage}
            onChange={(e) => setWaveMessage(e.currentTarget.value)}
          ></textarea>
          <button disabled={isLoading} className='waveButton' type='submit'>
            Wave at Me
          </button>
        </form>
        {isLoading && <p>head to metamask and let me process this action...</p>}
        {txnHash && (
          <div>
            Done, check{" "}
            <a
              target='_blank'
              rel='noopener noreferrer'
              href={`https://rinkeby.etherscan.io/tx/${txnHash}`}
            >
              hash
            </a>
          </div>
        )}
        {!connectedAccount && (
          <button className='waveButton' onClick={connectWallet}>
            Connect wallet
          </button>
        )}
        {allWaves.map((wave) => (
          <div
            style={{
              backgroundColor: "OldLace",
              marginTop: "1rem",
              padding: "0.5rem",
            }}
          >
            <h4>Address: {wave.address}</h4>
            <h4>Time: {wave.timestamp.toString()}</h4>
            <h3>Message: {wave.message}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
