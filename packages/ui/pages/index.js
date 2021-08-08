import styles from "../styles/Home.module.css";
import { signIn, signOut, userSession } from "../lib/auth";
import { useAtom } from "jotai";
import { useState } from "react";
import { StacksTestnet } from "@stacks/network";
// import { useConnect as syvConnect } from "@syvita/connect-react";
import {
  uintCV,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
} from "@syvita/transactions";

export default function Home() {
  const CONTRACT_ADDRESS = "ST343J7DNE122AVCSC4HEK4MF871PW470ZV04CFXH";
  const NETWORK = new StacksTestnet();

  const [amount, setAmount] = useState();
  const [txId, setTxId] = useState();

  console.log(userSession);

  // const buyMia = async () => {
  //   await doContractCall({
  //     contractAddress: CONTRACT_ADDRESS,
  //     contractName: "buy-mia",
  //     functionName: "buy-mia",
  //     functionArgs: [uintCV(amount)],
  //     postConditionMode: PostConditionMode.Deny,
  //     postConditions: [
  //       makeStandardSTXPostCondition(
  //         STXAddress,
  //         FungibleConditionCode.Equal,
  //         uintCV(amount).value
  //       ),
  //     ],
  //     network: NETWORK,
  //     onFinish: (result) => {
  //       setTxId(result.txId);
  //     },
  //   });
  // };

  return (
    <div className={styles.buy}>
      <img src="/mia.svg" height="64" width="64"></img>
      <h1>Buy $MIA from Syvita</h1>
      {userSession.isUserSignedIn() && (
        <input
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Number of MiamiCoin"
        ></input>
      )}
      <div>
        <img src="/eye.svg" height="14" width="14"></img>0.015 STX/MIA |
        2,678,932 MIA left
      </div>
      {userSession.isUserSignedIn() && (
        <button className={styles.button}>Buy</button>
      )}
      {!userSession.isUserSignedIn() && (
        <button className={styles.button} onClick={signIn}>
          Connect Wallet
        </button>
      )}

      {userSession.isUserSignedIn() && (
        <button className={styles.signOut} onClick={signOut}>
          Sign Out
        </button>
      )}
    </div>
  );
}
