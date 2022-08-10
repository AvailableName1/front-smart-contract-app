import { ethers } from "ethers";
import * as React from "react";
import "./App.scss";
import abi from "./utils/WavePortal.json";

import MessageInput from "./components/MessageInput";

export default function App() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [display, setDisplay] = React.useState(false);
  const [chainApplicable, setChainApplicable] = React.useState(true);
  const [count, setCount] = React.useState(null);
  const [txnHash, setTxnHash] = React.useState("");
  const [connectedAccount, setConnectedAccount] = React.useState("");
  const [allWaves, setAllWaves] = React.useState([]);
  const [waveMessage, setWaveMessage] = React.useState("");

  const contractAddress = "0x245E9204E33f789258743089Ff15b6A2d6471C49";
  const contractABI = abi.abi;

  // this should update all waves
  const getAllWaves = React.useCallback(async () => {
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
        await wavePortalContract.getTotalWaves().then((waves) => {
          setCount(waves.toNumber());
        });
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
  }, [contractABI]);

  // this checks of any accounts connected and to the right network
  const checkIfWalletConnected = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (accounts.length !== 0 && chainId === "0x4") {
        const account = accounts[0];
        console.log("Found authed acc", account);
        setConnectedAccount(account);
        setDisplay(true);
        setChainApplicable(true);
      } else if (chainId !== "0x4") {
        setChainApplicable(false);
        throw new Error("please switch to Rinkeby test Network");
      } else {
        throw new Error("no accs connected");
      }
    } catch (e) {
      console.log(e);
      setDisplay(false);
    }
  };

  // this is to connect wallet
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
      console.error(e);
    }
  };

  const changeNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x4" }],
      });
    } catch (e) {
      console.error(e);
    }
  };

  // this is a base function from contract to interact with it
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

        setIsLoading(true);
        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });
        console.log("Processing...", waveTxn.hash);

        await waveTxn.wait().then(() => {
          setIsLoading(false);
          setTxnHash(waveTxn.hash);
          setWaveMessage("");
        });
        console.log("Done -- ", waveTxn.hash);
      } else {
        throw new Error("eth object doesnt exist in window");
      }
    } catch (e) {
      setIsLoading(false);
      console.log(e);
    }
  };

  // this checks on first render if user has metamask
  React.useEffect(() => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask");
    } else {
      console.log("window has eth object injected", ethereum);
    }
  }, []);

  // this checks if wallet is connected and also gets all waves when connected and depends on account change also looks for chain change and reloads if any
  React.useEffect(() => {
    const initialise = async () => {
      await checkIfWalletConnected();
      await getAllWaves();
    };
    // we want to reload page every time network changes
    const handleChainChanged = (_chainId) => {
      window.location.reload();
    };
    initialise();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async () => {
        initialise();
      });
      window.ethereum.on("chainChanged", handleChainChanged);
    }
    return () => {
      window.ethereum.removeListener("accountsChanged", async () => {
        initialise();
      });
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [getAllWaves]);

  // this adds NewWave event from contract listener and removes on umnount
  React.useEffect(() => {
    let wavePortalContract;
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setCount((prevValue) => prevValue + 1);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [contractABI]);

  return (
    <div className='mainContainer'>
      <div className='dataContainer'>
        <div className='header'>
          <h1>Introduction to web3 development</h1>
          <h6>
            made by{" "}
            <a
              className='git-link'
              href='https://github.com/AvailableName1'
              target='_blank'
              rel='noopener noreferrer'
            >
              t0rb1k
            </a>
          </h6>
        </div>
        <p>
          Number of total waves with the contract:{" "}
          {count ? (
            count
          ) : (
            <span style={{ fontStyle: "italic", fontWeight: "bold" }}>
              first connect wallet to Rinkeby
            </span>
          )}
        </p>
        {display && (
          <p className='explanation'>Type your message and send a wave</p>
        )}
        {display && (
          <MessageInput
            isLoading={isLoading}
            waveMessage={waveMessage}
            setWaveMessage={setWaveMessage}
            wave={wave}
          />
        )}
        {isLoading && <p>head to metamask and let me process this action...</p>}
        {display && txnHash && (
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
        {display &&
          allWaves.map((wave) => (
            <div
              key={wave.timestamp.toString()}
              style={{
                backgroundColor: "#F7F7F9",
                marginTop: "1rem",
                borderRadius: "10px",
                padding: "0.5rem",
                boxShadow: "4px 4px 8px 0px rgba(34, 60, 80, 0.2)",
              }}
            >
              <h4>Address: {wave.address}</h4>
              <h4>Time: {wave.timestamp.toString()}</h4>
              <h3>Message: {wave.message}</h3>
            </div>
          ))}
        {(!connectedAccount || !display) && (
          <button
            disabled={!chainApplicable}
            className='waveButton'
            onClick={connectWallet}
          >
            Connect wallet
          </button>
        )}
        {!chainApplicable && (
          <button className='waveButton' onClick={changeNetwork}>
            Change network to Rinkeby
          </button>
        )}
      </div>
    </div>
  );
}
