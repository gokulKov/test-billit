'use client';


import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';


const PlanFeatureContext = createContext();


// Custom hook for easy feature usage
export const usePlanFeatures = () => useContext(PlanFeatureContext);


export const PlanFeatureProvider = ({ children }) => {
    const [features, setFeatures] = useState({});
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.warn("❌ No token found for feature fetch.");
                    setLoading(false);
                    return;
                }


                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_BILLIT}/api/user/features`, {
                    headers: { Authorization: `Bearer ${token}` }
                });


                const featureMap = {};


                res.data.features.forEach(f => {
                    if (f.type === "boolean") {
                        featureMap[f.feature_key] = {
                            enabled: f.enabled,
                            type: f.type,
                            description: f.description,
                        };
                    } else if (f.type === "limit") {
                        featureMap[f.feature_key] = {
                            ...f.config, // includes maxPerCreation, totalPages, entriesPerPage
                            type: f.type,
                            description: f.description,
                        };
                    }
                });


                setFeatures(featureMap);
            } catch (error) {
                console.error("❌ Feature fetch error:", error?.response?.data || error);
            } finally {
                setLoading(false);
            }
        };


        fetchFeatures();
    }, []);


    // ✅ Utility to check if a feature is enabled safely
    const isFeatureEnabled = (featureKey) => {
        const feature = features[featureKey];
        return feature?.enabled ?? false; // returns true/false safely
    };


    return (
        <PlanFeatureContext.Provider value={{ features, loading, isFeatureEnabled }}>
            {children}
        </PlanFeatureContext.Provider>
    );
};

