import { Account, assertEquals, Chain, Clarinet } from "../deps.ts";
import { BuyMiaClient } from "./clients/buy-mia.ts";
import { TokenClient } from "./clients/token.ts";

const TOKEN = "miamicoin-token";
const BUY_MIA = "buy-mia";

function createClients(chain: Chain, accounts: Map<string, Account>) {
  const deployer = accounts.get("deployer")!;

  const tokenClient = new TokenClient(TOKEN, chain, deployer);
  const buyMiaClient = new BuyMiaClient(BUY_MIA, chain, deployer);

  return {
    tokenClient: tokenClient,
    buyMiaClient: buyMiaClient,
  };
}

Clarinet.test({
  name: "Sending tokens to contract by POOL owner succeeds and cause 1 FT Transfer Event",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const user = accounts.get("wallet_1")!;
    const amount = 1023123;
    chain.mineBlock([tokenClient.mint(amount, user)]);

    const receipt = chain.mineBlock([buyMiaClient.sellMia(amount, user)])
      .receipts[0];

    // assert
    receipt.result.expectOk().expectBool(true);
    assertEquals(receipt.events.length, 1);
    receipt.events.expectFungibleTokenTransferEvent(
      amount,
      user.address,
      buyMiaClient.getContractAddress(),
      "miamicoin"
    );
  },
});

Clarinet.test({
  name: "Sending tokens to contract by someone who is not POOL owner fails with ERR_UNAUTHORIZED",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const user = accounts.get("wallet_2")!;
    const amount = 1023123;
    chain.mineBlock([tokenClient.mint(amount, user)]);

    const receipt = chain.mineBlock([buyMiaClient.sellMia(amount, user)])
      .receipts[0];

    // assert
    receipt.result.expectErr().expectUint(BuyMiaClient.Err.ERR_UNAUTHORIZED);
    assertEquals(receipt.events.length, 0);
  },
});

Clarinet.test({
  name: "Withdrawing tokens from contract fails with ERR_UNAUTHORIZED when called by someone who is not pool owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const poolOwner = accounts.get("wallet_1")!;
    const user = accounts.get("wallet_2")!;
    const amount = 1023123;
    chain.mineBlock([
      tokenClient.mint(amount, poolOwner),
      buyMiaClient.sellMia(amount, poolOwner),
    ]);

    // act
    const receipt = chain.mineBlock([buyMiaClient.exitMia(amount, user)])
      .receipts[0];

    // assert
    receipt.result.expectErr().expectUint(BuyMiaClient.Err.ERR_UNAUTHORIZED);
    assertEquals(receipt.events.length, 0);
  },
});

Clarinet.test({
  name: "Withdrawing tokens from contract succeeds and cause FT Transfer Event when called by POOL owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const user = accounts.get("wallet_1")!;
    const amount = 1023123;
    chain.mineBlock([
      tokenClient.mint(amount, user),
      buyMiaClient.sellMia(amount, user),
    ]);

    // act
    const receipt = chain.mineBlock([buyMiaClient.exitMia(amount, user)])
      .receipts[0];

    // assert
    receipt.result.expectOk().expectBool(true);
    assertEquals(receipt.events.length, 1);
    receipt.events.expectFungibleTokenTransferEvent(
      amount,
      buyMiaClient.getContractAddress(),
      user.address,
      "miamicoin"
    );
  },
});
