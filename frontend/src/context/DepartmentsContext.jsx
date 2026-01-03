import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const DepartmentsContext = createContext();

export const DepartmentsProvider = ({ children }) => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data.departments || []);
        } catch (err) {
            console.error('Failed to fetch departments', err);
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartmentsDetailed = async () => {
        try {
            const res = await api.get('/departments/detailed');
            setDepartments(res.data.departments || []);
            return res.data.departments || [];
        } catch (err) {
            console.error('Failed to fetch detailed departments', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    return (
        <DepartmentsContext.Provider value={{ departments, loading, refresh: fetchDepartments, fetchDetailed: fetchDepartmentsDetailed }}>
            {children}
        </DepartmentsContext.Provider>
    );
};

export const useDepartments = () => useContext(DepartmentsContext);

export default DepartmentsContext;
