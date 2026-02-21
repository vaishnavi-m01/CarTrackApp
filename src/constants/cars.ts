export interface Specs {
    power: string;
    engine: string;
    topSpeed: string;
    mileage?: string;
    safety?: string;
    transmission?: string;
    groundClearance?: string;
    bootSpace?: string;
    length?: string;
    width?: string;
    tank?: string;
}

export interface ColorOption {
    name: string;
    color: string;
    images: string[];
}

export interface Car {
    id: string;
    brand: string;
    model: string;
    year: string;
    price: string;
    priceNumeric: number; // in Lakhs for easier filtering
    emi: string;
    image: string;
    category?: string;
    type: 'CAR' | 'BIKE';
    specs: Specs;
    colorOptions?: ColorOption[];
    status?: 'new' | 'upcoming' | 'trending';
}

export const BROWSE_CARS: Car[] = [
    {
        id: 'b1',
        brand: 'BMW',
        model: 'M3 Competition',
        year: '2024',
        price: '₹75.5 Lakh',
        priceNumeric: 75.5,
        emi: 'EMI from ₹1.5L/month',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800',
        category: 'Sedan, Sports, Luxury',
        type: 'CAR',
        status: 'new',
        specs: {
            power: '503 HP',
            engine: '3.0L Twin-Turbo',
            topSpeed: '290 km/h',
            mileage: '12 kmpl',
            safety: '5 Star (Euro NCAP)',
            transmission: '8-Speed Automatic',
            groundClearance: '120 mm',
            bootSpace: '480 L'
        },
        colorOptions: [
            {
                name: 'Blue',
                color: '#3182CE',
                images: [
                    'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&q=80&w=800',
                ]
            },
            {
                name: 'White',
                color: '#FFFFFF',
                images: [
                    'https://images.unsplash.com/photo-1617814076367-b759c7d6274a?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1616455572844-82acd9d4e652?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800',
                ]
            },
            {
                name: 'Black',
                color: '#1A202C',
                images: [
                    'https://images.unsplash.com/photo-1552519519-723af64e20e2?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?auto=format&fit=crop&q=80&w=800',
                ]
            }
        ]
    },
    {
        id: 'b2',
        brand: 'Audi',
        model: 'Q7 Luxury Quattro',
        year: '2024',
        price: '₹88.6 Lakh',
        priceNumeric: 88.6,
        emi: 'EMI from ₹1.8L/month',
        image: 'https://images.unsplash.com/photo-1567818738068-3003c41db81e?auto=format&fit=crop&q=80&w=400',
        category: 'SUV, Luxury',
        type: 'CAR',
        status: 'upcoming',
        specs: {
            power: '340 HP',
            engine: '3.0L TFSI',
            topSpeed: '250 km/h',
            mileage: '11.2 kmpl',
            safety: '5 Star (ANCAP)',
            transmission: '8-Speed Tiptronic',
            groundClearance: '210 mm',
            bootSpace: '865 L'
        },
        colorOptions: [
            {
                name: 'White',
                color: '#FFFFFF',
                images: [
                    'https://images.unsplash.com/photo-1567818738068-3003c41db81e?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=800',
                ]
            },
            {
                name: 'Black',
                color: '#1A202C',
                images: [
                    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1567818738068-3003c41db81e?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1542362567-b05500269774?auto=format&fit=crop&q=80&w=800',
                ]
            }
        ]
    },
    {
        id: 'b3',
        brand: 'Mercedes',
        model: 'C-Class AMG Line',
        year: '2023',
        price: '₹61.5 Lakh',
        priceNumeric: 61.5,
        emi: 'EMI from ₹1.2L/month',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=400',
        category: 'Sedan, Luxury',
        type: 'CAR',
        specs: {
            power: '258 HP',
            engine: '2.0L Turbo',
            topSpeed: '250 km/h',
            mileage: '16.5 kmpl',
            safety: '5 Star (Global NCAP)',
            transmission: '9G-TRONIC',
            groundClearance: '160 mm',
            bootSpace: '455 L'
        },
        colorOptions: [
            {
                name: 'Black',
                color: '#1A202C',
                images: [
                    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800',
                ]
            },
            {
                name: 'White',
                color: '#FFFFFF',
                images: [
                    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1542362567-b05500269774?auto=format&fit=crop&q=80&w=800',
                ]
            }
        ]
    },
    {
        id: 'b4',
        brand: 'Tesla',
        model: 'Model 3 Performance',
        year: '2024',
        price: '₹52.2 Lakh',
        priceNumeric: 52.2,
        emi: 'EMI from ₹1L/month',
        image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=400',
        category: 'Sedan, Electric',
        type: 'CAR',
        status: 'new',
        specs: { power: '450 HP', engine: 'Electric', topSpeed: '261 km/h' },
        colorOptions: [
            {
                name: 'White',
                color: '#FFFFFF',
                images: [
                    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1536700503339-1e4b06520771?auto=format&fit=crop&q=80&w=800',
                ]
            },
            {
                name: 'Red',
                color: '#E53E3E',
                images: [
                    'https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800',
                ]
            }
        ]
    },
    {
        id: 'b5',
        brand: 'Porsche',
        model: '911 Carrera S',
        year: '2024',
        price: '₹1.8 Crore',
        priceNumeric: 180,
        emi: 'EMI from ₹3.5L/month',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400',
        category: 'Sports, Luxury',
        type: 'CAR',
        specs: { power: '443 HP', engine: '3.0L Twin-Turbo', topSpeed: '308 km/h' },
        colorOptions: [
            {
                name: 'White',
                color: '#FFFFFF',
                images: [
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1542362567-b05500269774?auto=format&fit=crop&q=80&w=800',
                ]
            },
            {
                name: 'Red',
                color: '#E53E3E',
                images: [
                    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800',
                ]
            }
        ]
    },
    {
        id: 'b6',
        brand: 'Range Rover',
        model: 'Vogue SE Sport',
        year: '2024',
        price: '₹2.4 Crore',
        priceNumeric: 240,
        emi: 'EMI from ₹4.5L/month',
        image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=400',
        category: 'SUV, Luxury',
        type: 'CAR',
        specs: { power: '395 HP', engine: '3.0L Diesel', topSpeed: '225 km/h' },
        colorOptions: [
            {
                name: 'Black',
                color: '#1A202C',
                images: [
                    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800',
                ]
            },
            {
                name: 'White',
                color: '#FFFFFF',
                images: [
                    'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1617814076367-b759c7d6274a?auto=format&fit=crop&q=80&w=800',
                    'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800',
                ]
            }
        ]
    },
    {
        id: 'bk1',
        brand: 'Ducati',
        model: 'Panigale V4',
        year: '2024',
        price: '₹27.4 Lakh',
        priceNumeric: 27.4,
        emi: 'EMI from ₹55k/month',
        image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=400',
        category: 'Sports, Superbike',
        type: 'BIKE',
        status: 'new',
        specs: { power: '210 HP', engine: '1103cc', topSpeed: '299 km/h' },
    },
    {
        id: 'bk2',
        brand: 'Kawasaki',
        model: 'Ninja ZX-10R',
        year: '2024',
        price: '₹16.8 Lakh',
        priceNumeric: 16.8,
        emi: 'EMI from ₹35k/month',
        image: 'https://images.unsplash.com/photo-1635815631754-083b06969567?auto=format&fit=crop&q=80&w=400',
        category: 'Sports',
        type: 'BIKE',
        specs: { power: '203 HP', engine: '998cc', topSpeed: '299 km/h' },
    },
    {
        id: 'bk3',
        brand: 'BMW',
        model: 'S 1000 RR',
        year: '2024',
        price: '₹20.5 Lakh',
        priceNumeric: 20.5,
        emi: 'EMI from ₹42k/month',
        image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&q=80&w=400',
        category: 'Superbike, Sports',
        type: 'BIKE',
        status: 'upcoming',
        specs: { power: '207 HP', engine: '999cc', topSpeed: '303 km/h' },
    },
];
