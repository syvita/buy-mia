import styles from "../styles/Home.module.css";
import { useConnect, userSessionState } from "../lib/auth";
import { useAtom } from "jotai";
import { StacksMainnet } from "@stacks/network";
import { useEffect, useState } from "react";
import { useConnect as syConnect } from "@syvita/connect-react";
import Transaction from "../components/Transaction";

import {
  uintCV,
  makeStandardSTXPostCondition,
  PostConditionMode,
  FungibleConditionCode,
  callReadOnlyFunction,
  makeStandardFungiblePostCondition,
  createAssetInfo,
  makeContractFungiblePostCondition,
} from "@syvita/transactions";

export default function Home() {
  const { handleOpenAuth } = useConnect();
  const { handleSignOut } = useConnect();
  const [userSession] = useAtom(userSessionState);

  const [amount, setAmount] = useState(0);
  const [price, setPrice] = useState();
  const [remaining, setRemaining] = useState(0);
  const [txId, setTxId] = useState();

  useEffect(() => {
    getPrice().then((result) => setPrice(result));
    getRemaining().then((result) => setRemaining(result.toLocaleString()));
  }, []);

  let STXAddress = "";

  if (userSession.isUserSignedIn()) {
    STXAddress = userSession.loadUserData().profile.stxAddress.mainnet;
  }

  const { doContractCall } = syConnect();

  const NETWORK = new StacksMainnet();
  const GENESIS_CONTRACT_ADDRESS = "SP000000000000000000002Q6VF78";
  const CONTRACT_ADDRESS = "SP30G5580JNEJ6GRKKWPBY3JGKDBQXG57VV9PZAE4";
  const CONTRACT_NAME = "homely-lime-bass";

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
          uintCV(amount * price).value
        ),
        makeContractFungiblePostCondition(
          CONTRACT_ADDRESS,
          CONTRACT_NAME,
          FungibleConditionCode.Equal,
          uintCV(amount).value,
          createAssetInfo(
            "SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27",
            "miamicoin-token",
            "miamicoin"
          )
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
      senderAddress: GENESIS_CONTRACT_ADDRESS,
    });
    return parseFloat(result.value.value);
  }

  async function getRemaining() {
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-remaining",
      functionArgs: [],
      network: NETWORK,
      senderAddress: GENESIS_CONTRACT_ADDRESS,
    });
    return parseInt(result.value.value.value);
  }

  return txId ? (
    <Transaction txId={txId} />
  ) : (
    <>
      <h1 className={styles.swap}>Swap</h1>
      <div className={styles.buy}>
        <img src="/mia.svg" height="64" width="64" alt="MIA Logo"></img>
        <h1>Buy $MIA from Syvita</h1>
        {userSession.isUserSignedIn() && (
          <>
            <input onChange={(e) => setAmount(e.target.value)}></input>
            <label className={styles.number}>Number of MiamiCoin</label>
            <label className={styles.total}>
              {(amount * (price / 1000000)).toFixed(2)} STX
            </label>
            <div>
              <img src="/eye.svg" height="14" width="16" alt="Eye"></img>
              {price / 1000000} STX/MIA | {remaining} MIA left
            </div>
            <button onClick={buyMIA} className={styles.button}>
              Buy
            </button>
            <button className={styles.signOut} onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        )}
        {!userSession.isUserSignedIn() && (
          <>
            <div>
              <img src="/eye.svg" height="14" width="14" alt="Eye"></img>
              {price / 1000000} STX/MIA | {remaining} MIA left
            </div>
            <button className={styles.button} onClick={handleOpenAuth}>
              Connect Wallet
            </button>
          </>
        )}
      </div>
    </>
  );
}
