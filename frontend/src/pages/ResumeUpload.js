import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { uploadResume } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';


GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

function ResumeUpload() {
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const extractPdfText = async (pdfFile) => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += `${pageText}\n`;
    }

    return fullText.trim();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setError('');
    setStatus('');

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const isPdf =
      selectedFile.type === 'application/pdf' ||
      selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setError('Only PDF files are allowed.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const fileToBase64 = (pdfFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(pdfFile);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a PDF resume first.');
      return;
    }

    setUploading(true);
    setError('');
    setStatus('Reading PDF...');

    try {
      const [rawText, pdfData] = await Promise.all([
        extractPdfText(file),
        fileToBase64(file),
      ]);

      if (!rawText) {
        throw new Error('Could not extract text from this PDF.');
      }

      setStatus('Uploading resume...');
      const result = await uploadResume(token, file.name, rawText, pdfData);

      if (result.error) {
        throw new Error(result.error);
      }

      setStatus('Resume uploaded successfully.');
      await refreshUser();
    } catch (err) {
      setError(err.message || 'Upload failed.');
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d4caba', padding: 40, maxWidth: 480, width: '100%' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a18', marginBottom: 8 }}>Upload Resume</h1>
          <p style={{ color: '#7a7268', fontSize: 14, marginBottom: 24 }}>
            Upload your resume as a PDF so we can store and analyze its content later.
          </p>

          {error && <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {status && <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{status}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="resumeFile" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1a1a18', marginBottom: 6 }}>Resume PDF</label>
              <input
                id="resumeFile"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                required
                style={{ fontSize: 14 }}
              />
            </div>

            {file && (
              <p style={{ fontSize: 13, color: '#7a7268', marginBottom: 16 }}>
                Selected: <strong>{file.name}</strong>
              </p>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
                  background: '#1a1a18', color: '#f5f0e8', fontSize: 14, fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 10,
                  border: '1px solid #d4caba', background: 'transparent',
                  color: '#1a1a18', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default ResumeUpload;
