import React from 'react'
import SocialLogin from './SocialLogin'

interface UIPorops {
  socialLogin: SocialLogin
}

const googleCardStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  width: '319px',
  height: '45px',
  background: '#252525',
  borderRadius: '12px',
  border: 'none',
  cursor: 'pointer'
} as React.CSSProperties

const buttonTextSpan = {
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '18px',
  lineHeight: '23px',
  display: 'flex',
  alignItems: 'center',
  textAlign: 'center',
  color: '#FFFFFF'
} as React.CSSProperties

const container = {
  position: 'fixed',
  float: 'left',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  transition: 'opacity 400ms ease-in',
  border: '1px solid #181818',
  boxShadow: '5px 5px 0px #181818',
  borderRadius: 10,
  padding: 30,
  zIndex: 100,
  background: 'black'
} as React.CSSProperties

const footer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '26.39px'
} as React.CSSProperties

const footerNormalText = {
  fontStyle: 'normal',
  fontWeight: '600',
  fontSize: '14.109px',
  color: '#535353',
  lineGeight: '18px'
} as React.CSSProperties

const footerBigText = {
  fontStyle: 'normal',
  fontWeight: '700',
  fontSize: '16.1351px',
  lineHeight: '21px',
  color: '#535353'
} as React.CSSProperties

const UI: React.FC<UIPorops> = ({ socialLogin }) => {
  return (
    <div style={container}>
      <img
        src={'https://live-nft-hosted-assets.s3.ap-south-1.amazonaws.com/cancel_icon.svg'}
        style={{ position: 'absolute', right: 18, cursor: 'pointer' }}
        onClick={() => socialLogin.hideWallet()}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          color: '#FFFFFF',
          flexDirection: 'column'
        }}
      >
        <h1
          style={{
            fontStyle: 'normal',
            fontWeight: '700',
            fontSize: '28px',
            lineHeight: '110%',
            margin: '15px',
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            border: '1px solid #000000',
            textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
          }}
        >
          Biconomy Social Login
        </h1>
        <p
          style={{
            fontSize: '18px',
            marginBottom: 35
          }}
        >
          Create a wallet to continue
        </p>
      </div>
      <div>
        <button onClick={() => socialLogin.socialLogin()} style={googleCardStyle}>
          <img
            src={'https://live-nft-hosted-assets.s3.ap-south-1.amazonaws.com/google_logo.svg'}
            style={{ marginRight: 14 }}
          />
          <span style={buttonTextSpan}>Continue with Google</span>
        </button>
      </div>
      <hr style={{ margin: '20px 0' }} />
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => socialLogin.metamaskLogin()} style={googleCardStyle}>
          <span style={buttonTextSpan}>Connect MetaMask</span>
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => socialLogin.walletConnectLogin()} style={googleCardStyle}>
          <span style={buttonTextSpan}>Connect WalletConnect</span>
        </button>
      </div>
      <div style={footer}>
        <span style={footerNormalText}>powered by</span>
        <img
          src={'https://s2.coinmarketcap.com/static/img/coins/64x64/9543.png'}
          style={{ marginLeft: 12, marginRight: 6, width: 30 }}
        />
        <span style={footerBigText}>Biconomy</span>
      </div>
    </div>
  )
}

export default UI
