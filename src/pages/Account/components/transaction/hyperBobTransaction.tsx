import { Box, Input, Stack } from '@mui/material';
import React, { FC, useState } from 'react';

import { BoxProps, FormControl, FormGroup, Typography } from '@mui/material';
import { BorderBox } from '../../../../components/BorderBox';
import { Center } from '../../../../components/Center';
import { FormInput } from '../../../../components/FormInput';
import { HeadTitle } from '../../../../components/HeadTitle';
import Header from '../../../App/components/header';
import { colors } from '../../../../config/const';
import { Button } from '../../../../components/Button';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

import { TransactionComponentProps as Props } from '../types';
import {
  useBackgroundDispatch,
  useBackgroundSelector,
} from '../../../App/hooks';
import {
  sendTransactionRequest
} from '../../../Background/redux-slices/transactions';
import { BigNumber, Contract, ContractFactory, Wallet, ethers } from 'ethers';
import { gas } from '../../../../../utils/index';
import { getActiveNetwork } from '../../../Background/redux-slices/selectors/networkSelectors';
import { Provider } from 'react-redux';

import {
  Account__factory,
  HypERC20Collateral__factory,
} from '../../account-api/typechain-types';

import {
  getActiveAccount
} from '../../../Background/redux-slices/selectors/accountSelectors';
import { utils } from '@hyperlane-xyz/utils';
import { EthersTransactionRequest } from '../../../Background/services/types';

import JSBI from 'jsbi';

interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: ethers.BigNumber;
  liquidity: ethers.BigNumber;
  tick: number;
}

const destChainID = '11155111';
const QuoterAddr = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
const PoolFactroyAddr = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const GoerliUSDCAddr = '0x07865c6e87b9f70255377e024ace6630c1eaa37f';
const GoerliBOBAddr = '0x97a4ab97028466FE67F18A6cd67559BAABE391b8';
const SwapRouterAddr = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const HypERC20CollAddr = '0x1ECB226C20978B81f21041D71Eebc15Db8D2D7C3';
// const HypERC20CollAddr = "0xd06532148869ba2fdb1af29c79ba79002a833be0"
// NOTE: This is Costomize component
export const HyperBobTransaction: FC<Props> = ({ transaction, onComplete }) => {
  const backgroundDispatch = useBackgroundDispatch();

  const [gkAddress, setGkAddress] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [val, setVal] = useState('');
  const activeNetwork = useBackgroundSelector(getActiveNetwork);
  const activeAccount = useBackgroundSelector(getActiveAccount);
  const provider = new ethers.providers.JsonRpcProvider(activeNetwork.provider);

  const changeTransaction = async () => {
    // TODO: 新しいトランザクションを作成をすれば確認画面へ遷移する

    // console.log('transaction: %s:', JSON.stringify(transaction));

    const pubkey = '0xa321ff522233D0486F00370a15705F0406B641D4';
    // const transactions: EthersTransactionRequest[] = [];

    const account = Account__factory.connect(activeAccount, provider);

    const init: boolean = true;

    const amountIn = ethers.utils.parseUnits(val, 6);

    let tx: EthersTransactionRequest;
    if (init) {
      const initPopTx =
      await account.populateTransaction.initializePrivateTransfer();
    const initTx: EthersTransactionRequest = {
      ...initPopTx,
      from: activeAccount,
    };
    transactions.push(initTx);

    const amountIn = ethers.utils.parseUnits(val, 6);
    const quoter = new Contract(QuoterAddr, QuoterABI.abi, provider);
    const quotedAmountOut = await quoter.callStatic.quoteExactInputSingle(
      GoerliUSDCAddr,
      GoerliBOBAddr,
      FeeAmount.LOW,
      amountIn,
      0
    );
    console.log('amountin: %s', amountIn);
    console.log('val: %s', val);
    console.log('quotedAmountOut: %s', quotedAmountOut);

    const bobTokenContract = new Contract(
      GoerliBOBAddr,
      ERC20ABI.abi,
      provider
    );
    const approvePop = await bobTokenContract.populateTransaction.approve(
      SwapRouterAddr,
      amountIn
    );
    const approveTx: EthersTransactionRequest = {
      ...approvePop,
      from: activeAccount,
    };
    transactions.push(approveTx);

    const router = new Contract(SwapRouterAddr, SwapRouterABI.abi, provider);
    const exactInputSingleParams = {
      tokenIn: GoerliUSDCAddr,
      tokenOut: GoerliBOBAddr,
      fee: FeeAmount.LOW,
      recipient: activeAccount,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: amountIn,
      amountOutMinimum: BigNumber.from('0'),
      sqrtPriceLimitX96: 0,
    };
    console.log(
      'exactInputSingleParams: ',
      JSON.stringify(exactInputSingleParams)
    );
    let tradeTx = await router.populateTransaction.exactInputSingle(
      exactInputSingleParams
    );

    tradeTx = {
      ...tradeTx,
      from: activeAccount,
      gasLimit: 10000000,
    };

    console.log('tradeTx: ', JSON.stringify(tradeTx));
    transactions.push(tradeTx);

    const approveHypERC20CollPop =
      await bobTokenContract.populateTransaction.approve(
        HypERC20CollAddr,
        quotedAmountOut + 10 ** 18 * 100
      );
  
      console.log("amountIn: ", amountIn)
  
      const PopTx =
      await account.populateTransaction.bridgBOB(
        destChainID,
        utils.addressToBytes32(activeAccount as string),
        amountIn,
        GoerliUSDCAddr,
        callData,
        ethers.utils.parseEther("0.022")
      );
  
    console.log('PopTx: %s', PopTx);
  
     tx = {
       ...PopTx,
       from: activeAccount,
       gasLimit: gas.GAS_LIMIT
      };
    }

    const abiCorder = new ethers.utils.AbiCoder();
    const callData = abiCorder.encode(types, values);
    const hypERC20Coll = HypERC20Collateral__factory.connect(
      HypERC20CollAddr,
      provider
    );

    const hyperlaneTxPop =
      await hypERC20Coll.populateTransaction.transferRemoteWithCalldata(
        destChainID,
        utils.addressToBytes32(activeAccount),
        ethers.utils.parseEther(val),
        callData
      );

    const hyperlaneTx: EthersTransactionRequest = {
      ...hyperlaneTxPop,
      from: activeAccount,
    };

    transactions.push(hyperlaneTx);

    console.log('final transactions: %s', JSON.stringify(transactions));

    await backgroundDispatch(
      // transactionRequestのstateを変更する
      sendTransactionsRequest({
        transactionsRequest: transactions,
        origin: '',
      })
    );
    console.log("res: ", res)
    onComplete(transaction, undefined);
  };

  return (
    <Center
      minHeight="100vh"
      height="100%"
      width="60%"
      marginX="auto"
      // {...props}
    >
      <Header mb={2} />
      <BorderBox>
        <HeadTitle title="Transfer ETH" />
        <Typography marginBottom={4} width="100%" variant="body1" color="white">
          Please Enter below.
        </Typography>
        <FormGroup sx={{ width: '100%' }}>
          {/* zkAddress */}
          <FormControl sx={{ mb: 2 }} fullWidth variant="outlined">
            <FormInput
              value={gkAddress}
              onChange={(e) => setGkAddress(e.target.value)}
              placeholder="ZK Address"
            />
          </FormControl>
          {/* USDC */}
          <FormControl fullWidth variant="outlined">
            <FormInput
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="USDC"
            />
          </FormControl>
          <Button
            sx={{ marginLeft: 'auto', marginTop: 8 }}
            title="Confirm"
            onClick={changeTransaction}
            disabled={!gkAddress || !val}
            icon={
              <SendRoundedIcon
                sx={{
                  color: !gkAddress || !val ? colors.disabled : colors.white,
                }}
              />
            }
          />
        </FormGroup>
      </BorderBox>
    </Center>
  );
};

function fromReadableAmount(amount: number, decimals: number): JSBI {
  const extraDigits = Math.pow(10, countDecimals(amount));
  const adjustedAmount = amount * extraDigits;
  return JSBI.divide(
    JSBI.multiply(
      JSBI.BigInt(adjustedAmount),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
    ),
    JSBI.BigInt(extraDigits)
  );
}

function countDecimals(x: number) {
  if (Math.floor(x) === x) {
    return 0;
  }
  return x.toString().split('.')[1].length || 0;
}
export default HyperBobTransaction;
