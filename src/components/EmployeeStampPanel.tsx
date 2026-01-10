import { useState, useEffect } from 'react';
import { searchUsers, addStamp, getUserById, type StampUser } from '../lib/supabase';

const EmployeeStampPanel = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StampUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<StampUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchUsers(searchQuery.trim())
        .then(users => {
          setSearchResults(users);
        })
        .catch(err => {
          console.error('Search error:', err);
          setSearchResults([]);
        })
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
      setSelectedUser(null);
    }
  }, [searchQuery]);

  const handleAddStamp = async () => {
    if (!selectedUser) return;

    setIsAddingStamp(true);
    try {
      const updatedUser = await addStamp(selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
        setShowConfirm(false);
        setSuccessMessage(`Stamp added! ${updatedUser.name} now has ${updatedUser.stamps}/10 stamps.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: any) {
      alert('Error adding stamp: ' + (error.message || 'Please try again'));
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleUserSelect = async (user: StampUser) => {
    // Refresh user data
    const freshUser = await getUserById(user.id);
    if (freshUser) {
      setSelectedUser(freshUser);
    } else {
      setSelectedUser(user);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-burger-accent-red mb-2">Employee Stamp Panel</h2>
        <p className="text-gray-500">Search by name or last 4 digits of phone number</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter name or last 4 digits (e.g., 5678)"
          className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-burger-accent-red focus:outline-none transition-all"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Search Results */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Search Results</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isSearching && (
              <p className="text-center text-gray-400 py-8">Searching...</p>
            )}

            {!isSearching && searchQuery.trim().length < 2 && (
              <p className="text-center text-gray-400 py-8">Type at least 2 characters to search</p>
            )}

            {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="text-center text-gray-400 py-8">No users found</p>
            )}

            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedUser?.id === user.id
                    ? 'border-burger-accent-red bg-burger-accent-red/5'
                    : 'border-gray-200 hover:border-burger-accent-red/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">Phone: ••••{user.phone_last4}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-burger-accent-red">{user.stamps}</p>
                    <p className="text-xs text-gray-400">/10 stamps</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected User & Actions */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Selected User</h3>
          
          {selectedUser ? (
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <div className="mb-6">
                <h4 className="text-2xl font-bold text-gray-800 mb-1">{selectedUser.name}</h4>
                <p className="text-sm text-gray-500">Phone: ••••{selectedUser.phone_last4}</p>
              </div>

              {/* Stamp Count */}
              <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-gray-600 font-medium">Current Stamps</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-burger-accent-red">{selectedUser.stamps}</span>
                    <span className="text-gray-400 font-bold ml-1">/10</span>
                  </div>
                </div>

                {/* Stamp Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const stampNumber = i + 1;
                    const isFilled = stampNumber <= selectedUser.stamps;
                    return (
                      <div
                        key={stampNumber}
                        className={`aspect-square rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                          isFilled
                            ? 'border-burger-accent-red bg-burger-accent-red text-white'
                            : 'border-gray-300 text-gray-400'
                        }`}
                        style={isFilled && stampNumber !== 10 ? {
                          backgroundImage: 'url(/images/burgergo-stamp.jpg)',
                          backgroundSize: '70%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {stampNumber === 10 ? 'FREE' : !isFilled ? stampNumber.toString().padStart(2, '0') : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Stamp Button */}
              {selectedUser.stamps < 10 ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-4 bg-burger-accent-red text-white font-bold rounded-xl hover:bg-burger-accent-dark transition-all shadow-lg"
                >
                  Add Stamp (+1)
                </button>
              ) : (
                <div className="w-full py-4 bg-green-500 text-white font-bold rounded-xl text-center">
                  ✓ Complete! 10/10 Stamps
                </div>
              )}

              {successMessage && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <p className="text-gray-400">Select a user to add stamps</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Add Stamp?</h3>
            <p className="text-gray-600 mb-6">
              Add 1 stamp to <strong>{selectedUser.name}</strong>?
              <br />
              Current: {selectedUser.stamps}/10 → New: {Math.min(selectedUser.stamps + 1, 10)}/10
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStamp}
                disabled={isAddingStamp}
                className="flex-1 px-4 py-3 bg-burger-accent-red text-white rounded-lg font-semibold hover:bg-burger-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? 'Adding...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeStampPanel;
