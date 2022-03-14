require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/DI9EzeJC7tkPAh-hLIPth5mkPpOzeD5a',
      accounts: ['0a40c8d5a6ad61a0a972357d2fcb0b32006c5e419f890317435349b44f8abd3e'],
    },
  },
};