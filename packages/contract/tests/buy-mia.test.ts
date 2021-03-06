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

Clarinet.test({
  name: "Buying tokens fails with ERR_UNAUTHORIZED when called by POOL owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const poolOwner = accounts.get("wallet_1")!;
    const amount = 1023123;
    chain.mineBlock([
      tokenClient.mint(amount, poolOwner),
      buyMiaClient.sellMia(amount, poolOwner),
    ]);

    // act
    const receipt = chain.mineBlock([buyMiaClient.buyMia(amount, poolOwner)])
      .receipts[0];

    // assert
    receipt.result.expectErr().expectUint(BuyMiaClient.Err.ERR_UNAUTHORIZED);
    assertEquals(receipt.events.length, 0);
  },
});

Clarinet.test({
  name: "Buying tokens succeeds and cause one FT Transfer Event, and on STX event when called by someone who is not POOL owner.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const poolOwner = accounts.get("wallet_1")!;
    const amount = 10000000;
    const user = accounts.get("wallet_2")!;
    const buyAmount = 200;
    chain.mineBlock([
      tokenClient.mint(amount, poolOwner),
      buyMiaClient.sellMia(amount, poolOwner),
    ]);

    // act
    const receipt = chain.mineBlock([buyMiaClient.buyMia(buyAmount, user)])
      .receipts[0];

    // assert
    receipt.result.expectOk().expectBool(true);
    assertEquals(receipt.events.length, 2);

    receipt.events.expectFungibleTokenTransferEvent(
      buyAmount,
      buyMiaClient.getContractAddress(),
      user.address,
      "miamicoin"
    );

    receipt.events.expectSTXTransferEvent(
      buyAmount * BuyMiaClient.DEFAULT_PRICE,
      user.address,
      poolOwner.address
    );
  },
});

Clarinet.test({
  name: "Changing price fails with ERR_UNAUTHORIZED when called by someone who is not POOL owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const user = accounts.get("wallet_2")!;
    const newPrice = 20;

    // act
    const receipt = chain.mineBlock([buyMiaClient.changePrice(newPrice, user)])
      .receipts[0];

    // assert
    receipt.result.expectErr().expectUint(BuyMiaClient.Err.ERR_UNAUTHORIZED);
  },
});

Clarinet.test({
  name: "Changing price succeeds and saves new price when called by POOL owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const poolOwner = accounts.get("wallet_1")!;
    const newPrice = 20;
    buyMiaClient.getPrice().expectOk().expectUint(BuyMiaClient.DEFAULT_PRICE);

    // act
    const receipt = chain.mineBlock([
      buyMiaClient.changePrice(newPrice, poolOwner),
    ]).receipts[0];

    // assert
    receipt.result.expectOk().expectBool(true);
    buyMiaClient.getPrice().expectOk().expectUint(newPrice);
  },
});

Clarinet.test({
  name: "Price changed by POOL owner is used while selling tokens to user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const poolOwner = accounts.get("wallet_1")!;
    const amount = 100000;
    const newPrice = 20;
    const user = accounts.get("wallet_2")!;
    const buyAmount = 5000;
    chain.mineBlock([
      tokenClient.mint(amount, poolOwner),
      buyMiaClient.sellMia(amount, poolOwner),
      buyMiaClient.changePrice(newPrice, poolOwner),
    ]);

    // act
    const receipt = chain.mineBlock([buyMiaClient.buyMia(buyAmount, user)])
      .receipts[0];

    // assert
    receipt.result.expectOk().expectBool(true);
    assertEquals(receipt.events.length, 2);

    receipt.events.expectSTXTransferEvent(
      buyAmount * newPrice,
      user.address,
      poolOwner.address
    );

    receipt.events.expectFungibleTokenTransferEvent(
      buyAmount,
      buyMiaClient.getContractAddress(),
      user.address,
      "miamicoin"
    );
  },
});


Clarinet.test({
  name: "When price is changed to 0 buying tokens is impossible",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const { tokenClient, buyMiaClient } = createClients(chain, accounts);
    const poolOwner = accounts.get("wallet_1")!;
    const amount = 100000;
    const newPrice = 0;
    const user = accounts.get("wallet_2")!;
    const buyAmount = 5000;
    chain.mineBlock([
      tokenClient.mint(amount, poolOwner),
      buyMiaClient.sellMia(amount, poolOwner),
      buyMiaClient.changePrice(newPrice, poolOwner),
    ]);

    // act
    const receipt = chain.mineBlock([buyMiaClient.buyMia(buyAmount, user)])
      .receipts[0];

    // assert
    receipt.result.expectErr().expectUint(3); //(err u3) = STX amount to send is non-positive
    assertEquals(receipt.events.length, 0);
  },
});