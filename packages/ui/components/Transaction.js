import { useState, useEffect } from "react";
import styles from "../styles/Transaction.module.css";

const Transaction = ({ txId }) => {
  const [status, setStatus] = useState();
  useEffect(() => {
    async function getStatus() {
      const url =
        "https://stacks-node-api.stacks.co/" + "extended/v1/tx/" + txId;
      const res = await fetch(url);
      const result = await res.json();
      return result.tx_status;
    }
    getStatus().then((result) => {
      setStatus(result);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  let title = "";
  let image = "";
  switch (status) {
    default:
      title = "Transaction pending...";
      image = "/tx-status/pending.svg";
  }

  const explorer_url = `https://explorer.stacks.co/txid/${txId}?chain=mainnet}`;
  return (
    <div className={styles.transaction}>
      <img src={image} height="66px" width="66px" alt="Cycles" />
      <h2>{title}</h2>
      <p>
        {/* This page will autoupdate with the status. */}
        <a href={explorer_url} target="_blank" rel="noopener noreferrer">
          View on Stacks Explorer
        </a>
      </p>
    </div>
  );
};

export default Transaction;
