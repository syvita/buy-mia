import { Account, Tx, types } from "../../deps.ts";
import { BaseClient } from "./base.ts";

enum Err {
  ERR_UNAUTHORIZED = 1000,
}

export class BuyMiaClient extends BaseClient {
  static Err = Err;

  sellMia(amount: number, sender: Account) {
    return Tx.contractCall(
      this.contractName,
      "sell-mia",
      [types.uint(amount)],
      sender.address
    );
  }
}
