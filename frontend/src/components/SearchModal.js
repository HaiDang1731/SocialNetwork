import React, { useState, useEffect } from 'react';
import '../css/SearchModal.css';

const API_URL = "http://localhost:8080";

function SearchModal({ isOpen, onClose }) {
      const [searchQuery, setSearchQuery] = useState("");
      const [searchResults, setSearchResults] = useState([]);
      const [recentSearches, setRecentSearches] = useState([]);
      const [loading, setLoading] = useState(false);

      // Load recent searches từ localStorage
      useEffect(() => {
            const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            setRecentSearches(recent);
      }, []);

      // Tìm kiếm user
      const searchUsers = async (query) => {
            if (!query.trim()) {
                  setSearchResults([]);
                  return;
            }

            setLoading(true);
            try {
                  const response = await fetch(`${API_URL}/api/users/search?query=${encodeURIComponent(query)}`);
                  if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data);
                  }
            } catch (error) {
                  console.error('Error searching users:', error);
            } finally {
                  setLoading(false);
            }
      };

      // Debounce search
      useEffect(() => {
            const timer = setTimeout(() => {
                  searchUsers(searchQuery);
            }, 300);

            return () => clearTimeout(timer);
      }, [searchQuery]);

      // Thêm vào recent searches
      const addToRecentSearches = (user) => {
            const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            const filtered = recent.filter(item => item.id !== user.id);
            const newRecent = [user, ...filtered].slice(0, 5); // Giữ tối đa 5 tìm kiếm gần đây

            localStorage.setItem('recentSearches', JSON.stringify(newRecent));
            setRecentSearches(newRecent);
      };

      // Xóa recent search
      const removeRecentSearch = (userId) => {
            const filtered = recentSearches.filter(user => user.id !== userId);
            localStorage.setItem('recentSearches', JSON.stringify(filtered));
            setRecentSearches(filtered);
      };

      // Xóa tất cả recent searches
      const clearAllRecentSearches = () => {
            localStorage.removeItem('recentSearches');
            setRecentSearches([]);
      };

      // Xử lý click vào user
      const handleUserClick = (user) => {
            addToRecentSearches(user);
            window.location.href = `/profile/${user.id}`;
      };

      // Xử lý đóng modal
      const handleClose = () => {
            setSearchQuery("");
            setSearchResults([]);
            onClose();
      };

      if (!isOpen) return null;

      return (
            <div className="search-modal-overlay" onClick={handleClose}>
                  <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="search-modal-header">
                              <h2>Tìm kiếm</h2>
                              <button className="search-modal-close" onClick={handleClose}>×</button>
                        </div>

                        {/* Search Input */}
                        <div className="search-modal-input">
                              <div className="search-input-container">
                                    <span className="search-icon">🔍</span>
                                    <input
                                          type="text"
                                          placeholder="Tìm kiếm"
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                          autoFocus
                                    />
                                    {searchQuery && (
                                          <button
                                                className="clear-search"
                                                onClick={() => setSearchQuery("")}
                                          >
                                                ×
                                          </button>
                                    )}
                              </div>
                        </div>

                        {/* Content */}
                        <div className="search-modal-content">
                              {loading ? (
                                    <div className="search-loading">Đang tìm kiếm...</div>
                              ) : searchQuery ? (
                                    // Kết quả tìm kiếm
                                    <div className="search-results">
                                          {searchResults.length > 0 ? (
                                                searchResults.map(user => (
                                                      <div
                                                            key={user.id}
                                                            className="search-result-item"
                                                            onClick={() => handleUserClick(user)}
                                                      >
                                                            <img
                                                                  src={user.avatarUrl ? `${API_URL}${user.avatarUrl}` : "/img/a1.jpeg"}
                                                                  alt="avatar"
                                                                  className="search-avatar"
                                                            />
                                                            <div className="search-user-info">
                                                                  <div className="search-username">{user.username}</div>
                                                                  {user.nickname && (
                                                                        <div className="search-nickname">{user.nickname}</div>
                                                                  )}
                                                            </div>
                                                      </div>
                                                ))
                                          ) : (
                                                <div className="no-results">Không tìm thấy kết quả nào</div>
                                          )}
                                    </div>
                              ) : (
                                    // Recent searches
                                    <div className="recent-searches">
                                          <div className="recent-header">
                                                <h3>Gần đây</h3>
                                                {recentSearches.length > 0 && (
                                                      <button
                                                            className="clear-all"
                                                            onClick={clearAllRecentSearches}
                                                      >
                                                            Xóa tất cả
                                                      </button>
                                                )}
                                          </div>
                                          {recentSearches.length > 0 ? (
                                                recentSearches.map(user => (
                                                      <div
                                                            key={user.id}
                                                            className="recent-item"
                                                      >
                                                            <div
                                                                  className="recent-user"
                                                                  onClick={() => handleUserClick(user)}
                                                            >
                                                                  <img
                                                                        src={user.avatarUrl ? `${API_URL}${user.avatarUrl}` : "/img/a1.jpeg"}
                                                                        alt="avatar"
                                                                        className="search-avatar"
                                                                  />
                                                                  <div className="search-user-info">
                                                                        <div className="search-username">{user.username}</div>
                                                                        {user.nickname && (
                                                                              <div className="search-nickname">{user.nickname}</div>
                                                                        )}
                                                                  </div>
                                                            </div>
                                                            <button
                                                                  className="remove-recent"
                                                                  onClick={() => removeRecentSearch(user.id)}
                                                            >
                                                                  ×
                                                            </button>
                                                      </div>
                                                ))
                                          ) : (
                                                <div className="no-recent">Không có tìm kiếm gần đây</div>
                                          )}
                                    </div>
                              )}
                        </div>
                  </div>
            </div>
      );
}

export default SearchModal; 