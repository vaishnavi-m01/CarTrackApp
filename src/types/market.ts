export interface VehicleType {
    id: number;
    name: string;
}

export interface Brand {
    id: number;
    name: string;
}

export interface Model {
    id: number;
    brand: Brand;
    name: string;
}

export interface FuelType {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: number;
    name: string;
    description: string;
}

export interface VehicleImage {
    id: number;
    vehicleColorId: number;
    imageUrl: string;
    imageType: string;
    isPrimary: boolean;
    sortOrder: number;
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface VehicleColor {
    id: number;
    marketInventoryId: number;
    colorName: string;
    activeStatus: boolean;
    images: VehicleImage[];
    createdAt: string;
    updatedAt: string;
    // Helper property to store hex code if mapped locally
    hexCode?: string;
}

export interface MarketInventory {
    id: number;
    userId: number;
    vehicleName: string;
    vehicleType: VehicleType;
    model: Model;
    fuelType: FuelType;
    year: number;
    priceNumeric: number;
    emiDisplay: string;
    imageUrl: string;
    status: string; // "ACTIVE" | "SOLD" | "upcoming" | "new"
    colors: VehicleColor[];
    category: Category;
    engineType: string;
    engineCc: number;
    powerHp: number;
    torqueNm: number;
    transmissionType: string;
    topSpeedKmh: number;
    specifications: string; // JSON string
    createdAt: string;
    updatedAt: string;
}
