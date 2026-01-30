import React, { createContext, useContext, useState } from 'react';

const SignatureContext = createContext(null);

export function SignatureProvider({ children }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [signatureImage, setSignatureImage] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [signatures, setSignatures] = useState({});

  return (
    <SignatureContext.Provider
      value={{
        pdfFile,
        setPdfFile,
        blocks,
        setBlocks,
        signatureImage,
        setSignatureImage,
        currentStep,
        setCurrentStep,
        signatures,
        setSignatures
      }}
    >
      {children}
    </SignatureContext.Provider>
  );
}

export function useSignature() {
  const ctx = useContext(SignatureContext);
  if (!ctx) throw new Error('useSignature must be used inside provider');
  return ctx;
}
