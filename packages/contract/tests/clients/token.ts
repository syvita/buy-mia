import { Account, Tx, types } from "../../deps.ts";
import { BaseClient } from "./base.ts";

export class TokenClient extends BaseClient {
  mint(amount: number, recipient: Account) {
    return Tx.contractCall(
      this.contractName,
      "test-mint",
      [types.uint(amount), types.principal(recipient.address)],
      this.deployer.address
    );
  }

  transfer(amount: number, from: Account, to: Account, sender: Account) {
    return Tx.contractCall(
      this.contractName,
      "transfer",
      [
        types.uint(amount),
        types.principal(from.address),
        types.principal(to.address),
        types.none(),
      ],
      sender.address
    );
  }
}
