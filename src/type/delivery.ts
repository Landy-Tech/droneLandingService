export interface IDelivery {
    _id?: string;
    deviceId: string;
    status?: 'Succeeded' | 'Failed' | 'Under process' | 'Pending';
    deliveryName: string;
    deliveryImageUrl?: string;
    failureReason?: string;
    request_time?: Date;
    start_date?: Date;
    end_time?: Date;
    dronMessage?: string;
    barcode?: string;
    description?: string;
}
export interface IDeliveryServer extends IDelivery {
    connectionDetails: any; // זמין רק בשרת
}

export interface INewDelivery{
    landAirId: string;
    deliveryName: string;
    deliveryImageUrl?: string;
    start_date?: Date;
    dronMessage?: string;
    barcode?: string;
    description?: string;
}

export interface INewDeliveryResult{
    status: number;
    message: string;
    delivery?: IDelivery;
}
