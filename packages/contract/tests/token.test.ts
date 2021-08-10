import { Account, assertEquals, Chain, Clarinet } from "../deps.ts";
import { TokenClient } from "./clients/token.ts";

const TOKEN = "miamicoin-token";

Clarinet.test({
  name: "Test miniting fake MIA tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const tokenClient = new TokenClient(
      TOKEN,
      chain,
      accounts.get("deployer")!
    );
    const user = accounts.get("wallet_1")!;
    const amount = 1023123;

    // act
    const receipt = chain.mineBlock([tokenClient.mint(amount, user)])
      .receipts[0];

    // assert
    receipt.result.expectOk().expectBool(true);
    assertEquals(receipt.events.length, 1);
    receipt.events.expectFungibleTokenMintEvent(
      amount,
      user.address,
      "miamicoin"
    );
  },
});

Clarinet.test({
  name: "Test transferring tokens from one user to another",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const tokenClient = new TokenClient(
      TOKEN,
      chain,
      accounts.get("deployer")!
    );
    const userA = accounts.get("wallet_1")!;
    const userB = accounts.get("wallet_2")!;
    const amount = 1023123;
    chain.mineBlock([tokenClient.mint(amount, userA)]);

    // act
    const receipt = chain.mineBlock([
      tokenClient.transfer(amount, userA, userB, userA),
    ]).receipts[0];

    // assert
    receipt.result.expectOk().expectBool(true);
    assertEquals(receipt.events.length, 1);
    receipt.events.expectFungibleTokenTransferEvent(
      amount,
      userA.address,
      userB.address,
      "miamicoin"
    );
  },
});
