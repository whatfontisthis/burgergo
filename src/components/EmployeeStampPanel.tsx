import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchUsers, addStamp, getUserById, useFreeBurger, buyBurgerWithFreeAvailable, getStampHistory, type StampUser, type StampHistory } from '../lib/supabase';
import { isEmployeeAuthenticated, employeeLogout } from '../lib/auth';

const EmployeeStampPanel = () => {
  const navigate = useNavigate();
  
  // Check authentication on mount
  useEffect(() => {
    if (!isEmployeeAuthenticated()) {
      navigate('/employee/login');
    }
  }, [navigate]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StampUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<StampUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFreeBurgerOptions, setShowFreeBurgerOptions] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load persisted selected user and recent users on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('burgergo_employee_selected_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setSelectedUser(user);
      } catch (e) {
        localStorage.removeItem('burgergo_employee_selected_user');
      }
    }

    const savedRecent = localStorage.getItem('burgergo_recent_users');
    if (savedRecent) {
      try {
        const recent = JSON.parse(savedRecent);
        setRecentUsers(recent.slice(0, 5)); // Keep only last 5
      } catch (e) {
        localStorage.removeItem('burgergo_recent_users');
      }
    }

    // Auto-focus search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Debounced search users when query changes
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      // Debounce search by 300ms
      debounceTimerRef.current = setTimeout(() => {
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
      }, 300);
    } else if (searchQuery.trim().length === 0) {
      // Only clear results when search is empty, don't clear selected user
      setSearchResults([]);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleAddStamp = async () => {
    if (!selectedUser) return;

    setIsAddingStamp(true);
    setStampAnimation(true);
    
    try {
      const updatedUser = await addStamp(selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
        localStorage.setItem('burgergo_employee_selected_user', JSON.stringify(updatedUser));
        setShowConfirm(false);
        
        // Visual feedback animation
        setTimeout(() => setStampAnimation(false), 600);
        
        // Refresh activity log
        try {
          const history = await getStampHistory(updatedUser.id);
          setActivityLog(history);
        } catch (err) {
          console.warn('Could not refresh activity log:', err);
        }
        
        // Show free burger options if user now has 10+ stamps and didn't before
        if (updatedUser.stamps >= 10 && updatedUser.free_burger_available && selectedUser.stamps < 10) {
          setShowFreeBurgerOptions(true);
          setSuccessMessage(`🎉 Stamp added! ${updatedUser.name} now has ${updatedUser.stamps} stamps - FREE BURGER AVAILABLE!`);
        } else {
          setSuccessMessage(`✓ Stamp added! ${updatedUser.name} now has ${updatedUser.stamps} stamps.`);
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        throw new Error('No user data returned from server');
      }
    } catch (error: any) {
      console.error('Error adding stamp:', error);
      setStampAnimation(false);
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      
      // Better error messages
      let userFriendlyError = 'Failed to add stamp. ';
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyError += 'Please check your internet connection and try again.';
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        userFriendlyError += 'Permission denied. Please check database policies.';
      } else if (errorMessage.includes('not found')) {
        userFriendlyError += 'User not found. Please refresh and try again.';
      } else {
        userFriendlyError += errorMessage;
      }
      
      alert(`${userFriendlyError}\n\nIf the problem persists, check:\n1. Supabase connection\n2. Browser console for details\n3. RLS policies in Supabase`);
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleUseFreeBurger = async () => {
    if (!selectedUser) return;

    setIsAddingStamp(true);
    try {
      const updatedUser = await useFreeBurger(selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
        setShowFreeBurgerOptions(false);
        const stampsUsed = selectedUser.stamps - updatedUser.stamps;
        setSuccessMessage(`Free burger redeemed! ${selectedUser.name} used ${stampsUsed} stamps. Remaining: ${updatedUser.stamps} stamps.`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error: any) {
      alert('Error using free burger: ' + (error.message || 'Please try again'));
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleBuyWithFreeAvailable = async () => {
    if (!selectedUser) return;

    setIsAddingStamp(true);
    try {
      const updatedUser = await buyBurgerWithFreeAvailable(selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
        setShowFreeBurgerOptions(false);
        setSuccessMessage(`Purchase recorded! ${updatedUser.name} still has free burger available.`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error: any) {
      alert('Error recording purchase: ' + (error.message || 'Please try again'));
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleUserSelect = async (user: StampUser) => {
    try {
      // Refresh user data from database
      const freshUser = await getUserById(user.id);
      const userToSet = freshUser || user;
      
      setSelectedUser(userToSet);
      
      // Persist selected user
      localStorage.setItem('burgergo_employee_selected_user', JSON.stringify(userToSet));
      
      // Add to recent users
      const updatedRecent = [userToSet, ...recentUsers.filter(u => u.id !== userToSet.id)].slice(0, 5);
      setRecentUsers(updatedRecent);
      localStorage.setItem('burgergo_recent_users', JSON.stringify(updatedRecent));
      
      // Load activity log
      try {
        const history = await getStampHistory(userToSet.id);
        setActivityLog(history);
      } catch (err) {
        console.warn('Could not load activity log:', err);
        setActivityLog([]);
      }
      
      // Clear search after a short delay to allow selection to show
      setTimeout(() => {
        setSearchQuery('');
        setSearchResults([]);
      }, 100);
    } catch (error) {
      console.error('Error selecting user:', error);
      // Still set the user even if refresh fails
      setSelectedUser(user);
      localStorage.setItem('burgergo_employee_selected_user', JSON.stringify(user));
      setTimeout(() => {
        setSearchQuery('');
        setSearchResults([]);
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-burger-accent-red mb-2">Employee Stamp Panel</h2>
          <p className="text-gray-500">Search by name or last 4 digits of phone number</p>
        </div>
        <button
          onClick={() => {
            employeeLogout();
            navigate('/employee/login');
          }}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          Logout
        </button>
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
                    <span className="text-gray-400 font-bold ml-1">stamps</span>
                    {selectedUser.stamps >= 10 && (
                      <div className="text-xs text-green-600 font-semibold mt-1">
                        ({Math.floor(selectedUser.stamps / 10)} free burger{Math.floor(selectedUser.stamps / 10) > 1 ? 's' : ''} available)
                      </div>
                    )}
                  </div>
                </div>

                {/* Stamp Grid - Shows progress toward next free burger */}
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const stampNumber = i + 1;
                    // Show progress toward next free burger (modulo 10)
                    const progressStamps = selectedUser.stamps % 10;
                    const isFilled = stampNumber <= progressStamps;
                    const hasFullSet = selectedUser.stamps >= 10;
                    const isAnimating = stampAnimation && stampNumber === progressStamps && isFilled;
                    return (
                      <div
                        key={stampNumber}
                        className={`aspect-square rounded-full border-2 flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                          isFilled
                            ? 'border-burger-accent-red bg-burger-accent-red text-white'
                            : 'border-gray-300 text-gray-400'
                        } ${isAnimating ? 'animate-pulse scale-125 ring-2 ring-burger-accent-red' : ''}`}
                      >
                        {stampNumber === 10 && hasFullSet ? 'FREE' : !isFilled ? stampNumber.toString().padStart(2, '0') : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedUser.stamps >= 10 && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Progress toward next free burger: {selectedUser.stamps % 10}/10
                  </p>
                )}
              </div>

              {/* Add Stamp Button */}
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-4 bg-burger-accent-red text-white font-bold rounded-xl hover:bg-burger-accent-dark transition-all shadow-lg"
              >
                Add Stamp (+1)
              </button>
              
              {selectedUser.stamps >= 10 && (
                <button
                  onClick={() => setShowFreeBurgerOptions(true)}
                  className="w-full mt-3 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                >
                  Redeem Free Burger (Use 10 Stamps)
                </button>
              )}

              {/* Activity Log Toggle */}
              {selectedUser && activityLog.length > 0 && (
                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  {showActivityLog ? '▼ Hide' : '▶ Show'} Activity Log ({activityLog.length})
                </button>
              )}

              {/* Activity Log Display */}
              {showActivityLog && activityLog.length > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                  <h4 className="text-sm font-bold text-gray-800 mb-2">Recent Activity</h4>
                  <div className="space-y-2">
                    {activityLog.map((entry) => (
                      <div key={entry.id} className="text-xs text-gray-600 flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                        <span>
                          {entry.added_by === 'employee' ? '📝 Stamp added' : 
                           entry.added_by === 'free_burger_used' ? '🎁 Free burger redeemed' :
                           entry.added_by === 'purchase_with_free_available' ? '💰 Purchase recorded' :
                           '📌 Activity'}
                        </span>
                        <span className="text-gray-400">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
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

      {/* Free Burger Options Modal */}
      {showFreeBurgerOptions && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">🎉 Free Burger Available!</h3>
            <p className="text-gray-600 mb-6">
              <strong>{selectedUser.name}</strong> has 10 stamps and is eligible for a FREE burger.
              <br /><br />
              How would you like to proceed?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleUseFreeBurger}
                disabled={isAddingStamp}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? 'Processing...' : '✓ Use Free Burger (Reset to 0)'}
              </button>
              <button
                onClick={handleBuyWithFreeAvailable}
                disabled={isAddingStamp}
                className="w-full py-4 bg-burger-accent-red text-white font-bold rounded-xl hover:bg-burger-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? 'Processing...' : '💰 Customer Buys (Keep Free Burger)'}
              </button>
              <button
                onClick={() => setShowFreeBurgerOptions(false)}
                disabled={isAddingStamp}
                className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Burger Options Modal */}
      {showFreeBurgerOptions && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">🎉 Free Burger Available!</h3>
            <p className="text-gray-600 mb-6">
              <strong>{selectedUser.name}</strong> has 10 stamps and is eligible for a FREE burger.
              <br /><br />
              How would you like to proceed?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleUseFreeBurger}
                disabled={isAddingStamp}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? 'Processing...' : '✓ Use Free Burger (Reset to 0)'}
              </button>
              <button
                onClick={handleBuyWithFreeAvailable}
                disabled={isAddingStamp}
                className="w-full py-4 bg-burger-accent-red text-white font-bold rounded-xl hover:bg-burger-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? 'Processing...' : '💰 Customer Buys (Keep Free Burger)'}
              </button>
              <button
                onClick={() => setShowFreeBurgerOptions(false)}
                disabled={isAddingStamp}
                className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
