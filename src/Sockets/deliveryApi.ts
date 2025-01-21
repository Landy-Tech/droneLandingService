import axios from 'axios';
import { IDevice } from '../type/device';

const DELIVERY_API_URL = "https://api-service-hab9fmgne7dxa5ad.italynorth-01.azurewebsites.net/api/delivery";
const DEVICE_API_URL = "https://api-service-hab9fmgne7dxa5ad.italynorth-01.azurewebsites.net/api/device";
const DELIVERY_STATUS_API_URL = "https://api-service-hab9fmgne7dxa5ad.italynorth-01.azurewebsites.net/api/delivery";

export const newDelivery = async (data: Record<string, unknown>) => {
    try {
        console.log('Calling newDelivery API with:', data);
        const response = await axios.post(`${DELIVERY_API_URL}/new`, data);
        console.log('API response:', response.data);

        const delivery = response.data.delivery;
        if (!delivery || !delivery._id) {
            throw new Error('Delivery ID is missing in response');
        }

        return { status: response.status, deliveryId: delivery._id };
    } catch (error: unknown) {
        return handleApiError(error);
    }
};

export const updateDeliveryStatus = async (deliveryId: string, status: string, endTime: string) => {
    try {
        if (!deliveryId || !status || !endTime) {
            throw new Error('Delivery ID, status, or endTime is missing');
        }

        const url = `${DELIVERY_STATUS_API_URL}/${deliveryId}/wss`;
        console.log('Sending PUT request to:', url, 'with status:', status, 'and end_time:', endTime);

        const response = await axios.put(url, { status, end_time: endTime });
        console.log('Received response:', response);

        if (response.status === 200) {
            console.log('Delivery status updated successfully');
        }

        return { status: response.status, ...response.data };
    } catch (error: unknown) {
        return handleApiError(error);
    }
};

export const closeDelivery = async (deliveryId: string, success: boolean, failureReason?: string) => {
    try {
        const response = await axios.put(`${DELIVERY_API_URL}/${deliveryId}/close`, { success, failureReason });
        return { status: response.status, ...response.data };
    } catch (error: unknown) {
        return handleApiError(error);
    }
};

const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            console.error('Axios error:', error.response.data);
            return {
                status: error.response.status || 500,
                message: error.response.data?.message || 'Unknown error occurred.',
            };
        } else {
            console.error('Axios error without response:', error.message);
            return {
                status: 500,
                message: 'Network error or no response from server.',
            };
        }
    }

    console.error('Unexpected error:', error);
    return {
        status: 500,
        message: 'Internal server error.',
    };
};

export const getDeviceStatus = async (deviceId: string) => {
    try {
        if (!deviceId) {
            throw new Error("Device ID is required.");
        }
        const response = await axios.get(`${DEVICE_API_URL}/${deviceId}`);
        console.log('Device status response:', response.data);

        const deviceStatus = response.data.status;

        if (deviceStatus === 'active') {
            return { status: 'Active' };
        } else {
            return { status: 'Inactive' };
        }
    } catch (error: unknown) {
        return handleApiError(error);
    }
};

export const updateDeviceStatus = async (deviceId: string, data: Partial<IDevice>) => {
    try {
        const url = `${DEVICE_API_URL}/${deviceId}/wss`;
        console.log('Sending PUT request to:', url, 'with data:', data);

        // הגדרת timeout כאן
        const response = await axios.put(url, data, { timeout: 10000 });

        console.log('Received response:', response);

        if (response.status === 200) {
            console.log('Device status updated successfully');
        }

        return { status: response.status, ...response.data };
    } catch (error: unknown) {
        return handleApiError(error);
    }
};
