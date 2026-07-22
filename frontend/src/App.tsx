import { useState, useEffect } from 'react';
import { isConnected, requestAccess, getAddress } from '@stellar/freighter-api';
import { getNotes, createNote, deleteNote, Note, CONTRACT_ID } from './soroban';

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    checkWallet();
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setFetching(true);
    try {
      const fetchedNotes = await getNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setFetching(false);
    }
  };

  const checkWallet = async () => {
    try {
      const { isConnected: connected } = await isConnected();
      if (connected) {
        const { address } = await getAddress();
        if (address) {
          setWalletAddress(address);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const connectWallet = async () => {
    try {
      const { address, error } = await requestAccess();
      if (error) {
        console.error('Freighter error:', error);
        alert('Failed to connect Freighter Wallet');
      } else if (address) {
        setWalletAddress(address);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect Freighter Wallet');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    if (!walletAddress) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    try {
      await createNote(walletAddress, title, content);
      setTitle('');
      setContent('');
      await loadNotes();
    } catch (error) {
      console.error('Create note failed:', error);
      alert('Transaction failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | bigint) => {
    if (!walletAddress) {
      alert('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    try {
      await deleteNote(walletAddress, id);
      await loadNotes();
    } catch (error) {
      console.error('Delete note failed:', error);
      alert('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="app-container">
      <header>
        <div>
          <h1>Web3 Notes</h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Contract: <code style={{ color: '#a78bfa' }}>{formatAddress(CONTRACT_ID)}</code> (Testnet)
          </p>
        </div>
        {walletAddress ? (
          <div className="wallet-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 'bold' }}>
            {formatAddress(walletAddress)}
          </div>
        ) : (
          <button className="btn" onClick={connectWallet}>
            Connect Freighter
          </button>
        )}
      </header>

      <main>
        <form className="create-form" onSubmit={handleCreateNote}>
          <h2>Create New Note</h2>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              className="form-control"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Processing Transaction...' : 'Save Note to Soroban'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Your Notes</h2>
          <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: 'rgba(255,255,255,0.1)' }} onClick={loadNotes} disabled={fetching}>
            {fetching ? 'Refreshing...' : 'Refresh Notes'}
          </button>
        </div>

        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id.toString()} className="note-card">
              <h3 className="note-title">{note.title}</h3>
              <p className="note-content">{note.content}</p>
              <div className="note-actions">
                <button className="btn btn-danger" onClick={() => handleDelete(note.id)} disabled={loading}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!fetching && notes.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No notes found on the smart contract. Create one above!</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
