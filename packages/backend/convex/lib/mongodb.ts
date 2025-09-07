"use node";

import { MongoClient, Db } from "mongodb";

// MongoDB connection configuration
const MONGODB_URI = "mongodb://localhost:27017/medicalDB";
const DATABASE_NAME = "medicalDB";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoConnection(): Promise<Db> {
    if (!client) {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log("Connected to MongoDB");
    }

    if (!db) {
        db = client.db(DATABASE_NAME);
    }

    return db;
}

export async function closeMongoConnection(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log("Disconnected from MongoDB");
    }
}

// Medical data types based on the collections
export interface Patient {
    _id?: any;
    name?: string;
    age?: number;
    gender?: string;
    contact?: string;
    address?: string;
    medicalHistory?: string[];
    allergies?: string[];
    [key: string]: any;
}

export interface Doctor {
    _id?: any;
    name?: string;
    specialization?: string;
    experience?: number;
    contact?: string;
    availability?: string[];
    [key: string]: any;
}

export interface Appointment {
    _id?: any;
    patientId?: any;
    doctorId?: any;
    date?: string;
    time?: string;
    status?: string;
    reason?: string;
    notes?: string;
    [key: string]: any;
}

export interface Prescription {
    _id?: any;
    patientId?: any;
    doctorId?: any;
    medications?: Array<{
        name?: string;
        dosage?: string;
        frequency?: string;
        duration?: string;
    }>;
    date?: string;
    notes?: string;
    [key: string]: any;
}

export interface Billing {
    _id?: any;
    patientId?: any;
    appointmentId?: any;
    amount?: number;
    status?: string;
    date?: string;
    services?: string[];
    [key: string]: any;
}

// Collection names
export const COLLECTIONS = {
    PATIENTS: "patients",
    DOCTORS: "doctors",
    APPOINTMENTS: "appointments",
    PRESCRIPTIONS: "prescriptions",
    BILLINGS: "bilings" // Note: keeping the typo as it appears in your DB
} as const;
