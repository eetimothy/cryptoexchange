import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants'

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer)

    // console.log({
    //     provider,
    //     signer,
    //     transactionContract
    // })
    return transactionsContract;
}

export const TransactionProvider = ({ children }) => {
    const [connectedAccount, setConnectedAccount] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))
    const [transactions, setTransactions] = useState([])
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
        keyword: '',
        message: ''
    })

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
    }

    const getAllTransactions = async () => { 
        try{
            if(!ethereum) return alert("Please install metamask.")
            const transactionsContract = getEthereumContract();
            const availableTransactions = await transactionsContract.getAllTransactions()

            const structuredTransactions = availableTransactions.map((transaction) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18)
            }))

            console.log(structuredTransactions)
            setTransactions(structuredTransactions)

        } catch(error) {
            console.log(error)
        }
    }

    const checkIfWalletIsConnected = async () => {
        try {
            if(!ethereum) return alert("Please install metamask.")

            const accounts = await ethereum.request({ method: 'eth_accounts' })
    
            if(accounts.length) {
                setConnectedAccount(accounts[0]);
                getAllTransactions();
            } else {
                console.log('no accounts found')
            }
    
            console.log(accounts)
        }
        catch (error) {
            throw new Error("no ethereum object")
        }  
    }

    const checkIfTransactionsExist = async () => {
        try {
            const transactionsContract = getEthereumContract();
            const transactionsCount = await transactionsContract.getTransactionCount();

            window.localStorage.setItem("transactionsCount", transactionsCount)
        } catch (error) {
            console.log(error)
            throw new Error("no ethereum object")
        }
    }

    const connectWallet = async () => {
        try {
            if(!ethereum) return alert("Please install metamask.")
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

            setConnectedAccount(accounts[0])
        }
        catch(error) {
            console.log(error)
            throw new Error("no ethereum object")
        }
    }

    const sendTransaction = async () => {
        try {
          if (ethereum) {
            const { addressTo, amount, keyword, message } = formData;
            const transactionsContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);
    
            await ethereum.request({
              method: "eth_sendTransaction",
              params: [{
                from: connectedAccount,
                to: addressTo,
                gas: "0x5208",
                value: parsedAmount._hex,
              }],
            });
    
            const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
    
            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            console.log(`Success - ${transactionHash.hash}`);
            setIsLoading(false);
    
            const transactionsCount = await transactionsContract.getTransactionCount();
    
            setTransactionCount(transactionsCount.toNumber());
            
          } else {
            console.log("No ethereum object");
          }
        } catch (error) {
          console.log(error);
    
          throw new Error("No ethereum object");
        }
      };

    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExist();
    }, [])

    return (
        <TransactionContext.Provider value={{ connectWallet, connectedAccount, formData, setFormData, handleChange, sendTransaction, transactions, isLoading }}>
            {children}
        </TransactionContext.Provider>
    )
}