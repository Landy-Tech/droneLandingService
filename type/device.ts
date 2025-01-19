export interface IDevice {
    _id: string;
    landAirId: string;
    landAirName: string;
    customerId: string;
    mainCustomerId?: string;
    pointOfContact?: string;
    phoneOfContact?: string;
    status: 'Active' | 'Faulty' | 'Busy' | 'InActive' | 'InDelivery';
    statusArea?: 'Success' | 'Failure' | 'In Progress';
    type: 'Fixed' | 'Portable';
    location?: string;
  }
  