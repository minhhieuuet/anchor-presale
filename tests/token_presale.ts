import * as anchor from "@project-serum/anchor";
import { Program, web3, BN } from "@project-serum/anchor";
import { TokenPresale } from "../target/types/token_presale";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  getAccount
} from "@solana/spl-token";
import { assert } from "chai";
import {
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';
import { ASSOCIATED_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
// BAB metadata - https://gateway.pinata.cloud/ipfs/QmbYunxDx4cpsf8KWdmDyiS8E41HW1QdBDLww3HUAyUgPP?_gl=1*1fecquc*_ga*MjA5NDM1ODAyMy4xNjU4MzI5NzY1*_ga_5RMPXG14TE*MTY3NTQyNDMxNC40LjEuMTY3NTQyNTU2OS4zNS4wLjA.
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
describe("token_presale", () => {
  // Configure the client to use the local cluster.

  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TokenPresale as Program<TokenPresale>;
  const PROGRAM_ID = program.programId;

  const WALLET_SEED = "WALLET_SEED";
  const PRESALE_SEED = "PRESALE_SEED";
  const BUYER_SEED = "BUYER_SEED";

  const myWallet = anchor.AnchorProvider.env().wallet;
  // const payer = anchor.AnchorProvider.env().wallet as anchor.Wallet;
  let payer = anchor.web3.Keypair.fromSecretKey(
    bs58.decode("xKDQmJBHbR3CWKhAYTF7y3YKQMBbfjnoZEyQH8GioEX98LForb6anLr1ZTRaB59kPnEU8PeSaMCgWAWhMantuHY")
  );

  let refByKeyPair = anchor.web3.Keypair.generate();

  const myPubkey = myWallet.publicKey;

  const pubkey1 = anchor.web3.Keypair.generate().publicKey;
  const pubkey2 = anchor.web3.Keypair.generate().publicKey;
  const TEN = new BN(10);
  const ONE = new BN(1);
  const TWO = new BN(2);
  const REF_PERCENTAGE = new BN(20_00);

  const tokenTitle = "BuildABonkToken";
  const tokenSymbol = "BAB";
  const tokenUri = "https://gateway.pinata.cloud/ipfs/QmbYunxDx4cpsf8KWdmDyiS8E41HW1QdBDLww3HUAyUgPP?_gl=1*1fecquc*_ga*MjA5NDM1ODAyMy4xNjU4MzI5NzY1*_ga_5RMPXG14TE*MTY3NTQyNDMxNC40LjEuMTY3NTQyNTU2OS4zNS4wLjA.";
  const quoteTokenTitle = "USDC";
  const quoteTokenSymbol = "USDC";
  const quoteTokenUri = "https://gateway.pinata.cloud/ipfs/QmW1YL2G1oY4RCHD78rhYJ15PP2Qo4Vd17wX2CmZpmn2vv?_gl=1*1wwza3w*_ga*MjA5NDM1ODAyMy4xNjU4MzI5NzY1*_ga_5RMPXG14TE*MTY3NjQ2MzgzOC43LjEuMTY3NjQ2Mzg0OS40OS4wLjA.";

  const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
  const bABTokenPubkey = new PublicKey("FTiEdZ1fjNGTaHDgc7uwzMVFTKx1eDpDxR57Uhg6M4aK");
  const quoteTokenPubkey = new PublicKey("APaCo32kC5hkJVHotZv3uG3p3eZMCAvXRojqB9P7865v");
  const MINT_DECIMALS = 10 ** 9;

  const recipientWallet: anchor.web3.Keypair = anchor.web3.Keypair.generate();
  const presaleAuthorityPubkey = payer.publicKey;


  const getWalletPDA = async () => {
    return (
      await PublicKey.findProgramAddressSync(
        [Buffer.from(WALLET_SEED), payer.publicKey.toBuffer()],
        PROGRAM_ID
      )
    )[0];
  };

  const getPresalePDA = async (presaleIdentifier: number) => {
    return (
      await PublicKey.findProgramAddressSync(
        [Buffer.from(PRESALE_SEED), payer.publicKey.toBuffer(), Uint8Array.from([presaleIdentifier])],
        PROGRAM_ID
      )
    )[0];
  };

  const getBuyerPresaleDetailPDA = async (presaleIdentifier: number, userPubkey: PublicKey) => {
    return (
      await PublicKey.findProgramAddressSync(
        [Buffer.from(BUYER_SEED), payer.publicKey.toBuffer(), Uint8Array.from([presaleIdentifier]), userPubkey.toBuffer()],
        PROGRAM_ID
      )
    )[0];
  }

  const getSplTokenBalance = async (tokenMint: PublicKey, owner: PublicKey) => {
    const tokenAccount = await getAssociatedTokenAddress(owner, tokenMint);
    const account = await getAccount(program.provider.connection, tokenAccount);
    return account.amount;
  }



  console.log(`My pubkey: ${payer.publicKey}`);
  console.log(`pubkey1: ${pubkey1}`);
  console.log(`pubkey2: ${pubkey2}`);

  before(async () => {
    // Create and fund person
    console.log("Signer: " + payer.publicKey)
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        payer.publicKey,
        50 * anchor.web3.LAMPORTS_PER_SOL
      ),
      "processed"
    );

    const metadataAddress = (await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];

    const sx = await program.methods.createToken(
      quoteTokenTitle, quoteTokenSymbol, quoteTokenUri
    )
      .accounts({
        metadataAccount: metadataAddress,
        mintAccount: mintKeypair.publicKey,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([mintKeypair, payer])
      .rpc();

    console.log("Success!");
    console.log(`   Mint Address: ${mintKeypair.publicKey}`);
    console.log(`   Tx Signature: ${sx}`);
    // start presale of the token
    const walletPDA = await getWalletPDA();
    const presalePDA = await getPresalePDA(0);
    console.log(`Wallet address: ${walletPDA}`);
    console.log(`Presale address: ${presalePDA}`);


    let tx = await program.methods
      .initializeWallet()
      .accounts({
        walletDetails: walletPDA,
        authority: payer.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([payer])
      .rpc();
    console.log("Initialized wallet!");


    tx = await program.methods
      .createPresale(
        mintKeypair.publicKey,
        new anchor.BN(1_000_000 * 10 ** 9), // tokens amount
        new anchor.BN(1000000000), // price lamport per tokens
        9, // token_decimals
        new anchor.BN(0), // min buy lamport
        REF_PERCENTAGE
      )
      .accounts({
        walletDetails: walletPDA,
        presaleDetails: presalePDA,
        authority: payer.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Created presale");

  })

  it("Got accounts!", async () => {

    const walletPDA = await getWalletPDA();
    const presalePDA = await getPresalePDA(0);
    console.log(`Presale address: ${presalePDA}`);

    const walletAccounts = await program.account.walletDetails.all();
    const presaleAccounts = await program.account.presaleDetails.all();
    const presaleAccount = await program.account.presaleDetails.fetch(presalePDA);
    const allAccounts = await program.account;

    console.log(walletAccounts);
    console.log(presaleAccounts);
    console.log(allAccounts);

  });


  it("Mint 1M tokens to your wallet!", async () => {

    const associatedTokenAccountAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: payer.publicKey,
    });
    // const tokenBalance = 
    // init associated token account

    const tx = await program.methods.mintTo(
      new anchor.BN(1_000_000 * MINT_DECIMALS)
    )
      .accounts({
        associatedTokenAccount: associatedTokenAccountAddress,
        mintAccount: mintKeypair.publicKey,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    console.log("Success mint!");
  });


  it("Deposit tokens to presale PDA 1!", async () => {

    const presalePDA = await getPresalePDA(0);

    console.log(`Presale address: ${presalePDA}`);

    console.log(`Mint: ${mintKeypair.publicKey}`)

    const fromAssociatedTokenAccountAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: payer.publicKey,
    });

    console.log(`From: ${fromAssociatedTokenAccountAddress}`);

    const toAssociatedTokenAccountAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: presalePDA,
    });

    console.log(`To: ${toAssociatedTokenAccountAddress}`);
    // const tokenBalanceBefore = await getSplTokenBalance( mintKeypair.publicKey, toAssociatedTokenAccountAddress );

    const sx = await program.methods.depositPresaleTokens(
      new anchor.BN(150 * MINT_DECIMALS),
      0
    )
      .accounts({
        mintAccount: mintKeypair.publicKey,
        fromAssociatedTokenAccount: fromAssociatedTokenAccountAddress,
        fromAuthority: payer.publicKey,
        toAssociatedTokenAccount: toAssociatedTokenAccountAddress,
        presaleDetailsPda: presalePDA,
        payer: payer.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .signers([payer])
      .rpc();

    // const tokenBalanceAfter = await getSplTokenBalance( mintKeypair.publicKey, presalePDA );

    // console.log(`Token balance before: ${tokenBalanceBefore}`);
    // console.log(`Token balance after: ${tokenBalanceAfter}`);


    const fromAccount = await getAccount(program.provider.connection, fromAssociatedTokenAccountAddress);
    const account = await getAccount(program.provider.connection, toAssociatedTokenAccountAddress);
    console.log(account);
    console.log(fromAccount);

    console.log("Success deposit!")
  });

  it("Withdraw tokens from presale PDA 1!", async () => {

    const presalePDA = await getPresalePDA(0);

    console.log(`Presale address: ${presalePDA}`);

    console.log(`Mint: ${mintKeypair.publicKey}`)

    const fromAssociatedTokenAccountAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: presalePDA,
    });

    console.log(`From: ${fromAssociatedTokenAccountAddress}`);

    const toAssociatedTokenAccountAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: payer.publicKey,
    });

    console.log(`To: ${toAssociatedTokenAccountAddress}`);

    const sx = await program.methods.withdrawPresaleTokens(
      new anchor.BN(150 * MINT_DECIMALS),
      0
    )
      .accounts({
        presaleDetailsPda: presalePDA,
        mintAccount: mintKeypair.publicKey,
        presaleAssociatedTokenAccount: fromAssociatedTokenAccountAddress,
        toAssociatedTokenAccount: toAssociatedTokenAccountAddress,
        recipient: payer.publicKey,
        authority: payer.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .signers([payer])
      .rpc({ skipPreflight: true });

    console.log("Success withdraw!");
  });


  it("Buy tokens from presale 0!", async () => {

    const presalePDA = await getPresalePDA(0);

    console.log(`Presale address: ${presalePDA}`);

    console.log(`Presale token mint: ${mintKeypair.publicKey}`);


    const buyerPresalePDA = await getBuyerPresaleDetailPDA(0, payer.publicKey);
    const presaleAssociatedTokenAccount = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: presalePDA,
    });

    const buyerAssociatedTokenAccount = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: payer.publicKey,
    });

    // start presale
    const startPresaleTx = await program.methods.startPresale(0, true).accounts({
      presaleDetails: presalePDA,
      authority: payer.publicKey,
    }).signers([payer]).rpc();

    console.log("Presale started!");

    const buyPresaleTx = await program.methods.buyPresaleTokens(
      new anchor.BN(1 * LAMPORTS_PER_SOL),
      0,
      presaleAuthorityPubkey,
      refByKeyPair.publicKey
    )
      .accounts({
        presaleDetailsPda: presalePDA,
        buyer: payer.publicKey,
        refBy: refByKeyPair.publicKey,
        beneficiary: payer.publicKey,
        presaleAuthority: payer.publicKey,
        buyerPresaleDetails: buyerPresalePDA,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const refBySolanaAmount = await program.provider.connection.getBalance(refByKeyPair.publicKey);
    console.log(`RefBy sol amount:`, refBySolanaAmount)

    /// deposit token to presale detail
    const fromAssociatedTokenAccountAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: payer.publicKey,
    });

    console.log(`From: ${fromAssociatedTokenAccountAddress}`);

    const toAssociatedTokenAccountAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: presalePDA,
    });

    const buyerAssociatedTokenAccountAmount = await program.provider.connection.getTokenAccountBalance(buyerAssociatedTokenAccount);
    console.log(`Buyer associated token amount:`, buyerAssociatedTokenAccountAmount.value.amount);
    const depositTokenTx = await program.methods.depositPresaleTokens(
      new anchor.BN(500_000 * MINT_DECIMALS),
      0
    )
      .accounts({
        mintAccount: mintKeypair.publicKey,
        fromAssociatedTokenAccount: fromAssociatedTokenAccountAddress,
        fromAuthority: payer.publicKey,
        toAssociatedTokenAccount: toAssociatedTokenAccountAddress,
        presaleDetailsPda: presalePDA,
        payer: payer.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .signers([payer])
      .rpc({
        commitment: 'confirmed',
      });

    const presaleDetailAmount = await program.provider.connection.getTokenAccountBalance(presaleAssociatedTokenAccount);
    console.log(`Presale detail amount:`, presaleDetailAmount.value.amount);

    // Enable claim tokens
    const enableClaimTx = await program.methods.enableClaim(0, true).accounts({
      presaleDetails: presalePDA,
      authority: payer.publicKey,
    }).signers([payer]).rpc({
      commitment: 'confirmed',
    });
    console.log("Enable claim success!")

    /// Claim tokens
    const claimTokenTx = await program.methods.claimPresaleTokens(
      0,
      payer.publicKey
    ).accounts({
      presaleDetailsPda: presalePDA,
      mintAccount: mintKeypair.publicKey,
      buyerAssociatedTokenAccount,
      presaleAssociatedTokenAccount,
      buyer: payer.publicKey,
      buyerPresaleDetails: buyerPresalePDA,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([payer]).rpc();

    console.log("Claim token success!");
  });

});
