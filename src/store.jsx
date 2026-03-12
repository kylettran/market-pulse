import { createContext, useContext, useReducer } from 'react';

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMZN'];

const initialState = {
  activeView: 'dashboard',
  selectedStock: 'AAPL',
  watchlist: JSON.parse(localStorage.getItem('mp_watchlist') || JSON.stringify(DEFAULT_WATCHLIST)),
  searchOpen: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
    case 'SELECT_STOCK':
      return { ...state, activeView: 'stock', selectedStock: action.payload };
    case 'ADD_TO_WATCHLIST': {
      if (state.watchlist.includes(action.payload)) return state;
      const added = [...state.watchlist, action.payload];
      localStorage.setItem('mp_watchlist', JSON.stringify(added));
      return { ...state, watchlist: added };
    }
    case 'REMOVE_FROM_WATCHLIST': {
      const removed = state.watchlist.filter(s => s !== action.payload);
      localStorage.setItem('mp_watchlist', JSON.stringify(removed));
      return { ...state, watchlist: removed };
    }
    case 'TOGGLE_SEARCH':
      return { ...state, searchOpen: !state.searchOpen };
    case 'CLOSE_SEARCH':
      return { ...state, searchOpen: false };
    default:
      return state;
  }
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
