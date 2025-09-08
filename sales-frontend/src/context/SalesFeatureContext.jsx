// Sales Feature Context for managing conditional rendering
function SalesFeatureProvider({ children }) {
  const [features, setFeatures] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [userPlan, setUserPlan] = React.useState('');

  const SALES_URL = window.SALES_URL || 'http://127.0.0.1:9000';

  const fetchFeatures = async () => {
    try {
      const token = localStorage.getItem('sales_token');
      if (!token) {
        setFeatures({}); // Clear features when no token
        setLoading(false);
        return;
      }

      const res = await fetch(`${SALES_URL}/api/user/features`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch features: ' + res.status);
      }

      const data = await res.json();
      const featureMap = {};

      // Process features from MongoDB format
      if (data.features && Array.isArray(data.features)) {
        data.features.forEach(f => {
          if (f.type === "boolean") {
            featureMap[f.feature_key] = {
              enabled: f.enabled,
              type: f.type,
              description: f.description,
            };
          } else if (f.type === "limit") {
            featureMap[f.feature_key] = {
              ...f.config, // includes maxBankAccounts, maxSuppliers, etc.
              type: f.type,
              description: f.description,
              enabled: true // Limit features are considered "enabled" 
            };
          }
        });
      }

      // Extract user plan from response
      if (data.userPlan) {
        setUserPlan(data.userPlan);
      }

      setFeatures(featureMap);
    } catch (error) {
      // Set empty features on error
      setFeatures({});
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFeatures();
    
    // Listen for login events to refetch features
    const handleLoginEvent = () => {
      fetchFeatures();
    };
    
    window.addEventListener('sales-login', handleLoginEvent);
    return () => window.removeEventListener('sales-login', handleLoginEvent);
  }, []);

  // Utility to check if a feature is enabled safely
  const isFeatureEnabled = (featureKey) => {
    const feature = features[featureKey];
    
    if (!feature) {
      return false;
    }
    
    // For boolean features, check the enabled flag
    if (feature.type === "boolean") {
      return feature.enabled === true;
    }
    
    // For limit features, they are considered "enabled" if they exist
    if (feature.type === "limit") {
      return true;
    }
    
    // Fallback
    return feature.enabled === true;
  };

  // Utility to get feature limit value
  const getFeatureLimit = (featureKey, limitKey) => {
    const feature = features[featureKey];
    return feature?.[limitKey] ?? 0;
  };

  // Utility to check if user has reached a limit
  const isLimitReached = (featureKey, limitKey, currentCount) => {
    const limit = getFeatureLimit(featureKey, limitKey);
    return currentCount >= limit;
  };

  const contextValue = {
    features,
    loading,
    userPlan,
    isFeatureEnabled,
    getFeatureLimit,
    isLimitReached,
    refetchFeatures: fetchFeatures
  };

  return React.createElement(
    SalesFeatureContext.Provider,
    { value: contextValue },
    children
  );
}

// Create context
const SalesFeatureContext = React.createContext();

// Custom hook for easy feature usage
const useSalesFeatures = () => React.useContext(SalesFeatureContext);

// Register globally
window.SalesFeatureProvider = SalesFeatureProvider;
window.SalesFeatureContext = SalesFeatureContext;
window.useSalesFeatures = useSalesFeatures;
