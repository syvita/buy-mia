import styles from "../styles/Home.module.css";
import { useConnect, userSessionState } from "../lib/auth";
import { useAtom } from "jotai";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { useEffect, useState } from "react";
import { useConnect as syConnect } from "@syvita/connect-react";
import {
  uintCV,
  noneCV,
  makeStandardSTXPostCondition,
  PostConditionMode,
  FungibleConditionCode,
  AnchorMode,
} from "@syvita/transactions";

export default function Home() {
  const { handleOpenAuth } = useConnect();
  const { handleSignOut } = useConnect();
  const [userSession] = useAtom(userSessionState);

  const [amount, setAmount] = useState();
  const [price, setPrice] = useState();
  const [remaining, setRemaining] = useState();
  const [txId, setTxId] = useState();

  useEffect(() => {}, []);

  let STXAddress = "";

  if (userSession.isUserSignedIn()) {
    STXAddress = userSession.loadUserData().profile.stxAddress.mainnet;
    console.log(STXAddress);
  }

  const { doContractCall } = syConnect();

  const NETWORK = new StacksMainnet();
  const CONTRACT_ADDRESS = "SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66";
  const CONTRACT_NAME = "buy-mia-v1";

  async function buyMIA() {
    await doContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "buy-mia",
      functionArgs: [uintCV(amount)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [
        makeStandardSTXPostCondition(
          STXAddress,
          FungibleConditionCode.Equal,
          uintCV(amount).value
        ),
      ],
      network: NETWORK,
      onFinish: (result) => {
        setTxId(result.txId);
      },
    });
  }

  async function getPrice() {
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-price",
      functionArgs: [],
      network: NETWORK,
      senderAddress: STXAddress,
    });
    return parseInt(result.value);
  }

  async function getRemaining() {
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-remaining",
      functionArgs: [],
      network: NETWORK,
      senderAddress: STXAddress,
    });
    return parseInt(result.value);
  }

  return (
    <div className={styles.buy}>
      <img src="/mia.svg" height="64" width="64" alt="MIA Logo"></img>
      <h1>Buy $MIA from Syvita</h1>
      {userSession.isUserSignedIn() && (
        <input
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Number of MiamiCoin"
        ></input>
      )}
      <div>
        <img src="/eye.svg" height="14" width="14" alt="Eye"></img>0.015 STX/MIA
        | 2,678,932 MIA left
      </div>
      {userSession.isUserSignedIn() && (
        <button onClick={buyMIA} className={styles.button}>
          Buy
        </button>
      )}
      {!userSession.isUserSignedIn() && (
        <button className={styles.button} onClick={handleOpenAuth}>
          Connect Wallet
        </button>
      )}

      {userSession.isUserSignedIn() && (
        <button className={styles.signOut} onClick={handleSignOut}>
          Sign Out
        </button>
      )}
    </div>
  );
}
