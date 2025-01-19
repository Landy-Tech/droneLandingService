import axios from 'axios';
import { IDevice } from '../type/device';

const DELIVERY_API_URL = "http://localhost:8080/api/delivery";
const DEVICE_API_URL = "http://localhost:8080/api/device";
const DELIVERY_STATUS_API_URL="http://localhost:8080/api/delivery";

export const newDelivery = async (data) => {
    try {
        console.log('Calling newDelivery API with:', data);
        const response = await axios.post(`${DELIVERY_API_URL}/new`, data);
        console.log('API response:', response.data);
        
        // Ensure the deliveryId exists in the response
        const delivery = response.data.delivery;  // Use the 'delivery' object from the response
        if (!delivery || !delivery._id) {
            throw new Error('Delivery ID is missing in response');
        }
        
        return { status: response.status, deliveryId: delivery._id };  // Use '_id' as deliveryId
    } catch (error) {
        return handleApiError(error);
    }
};

export const updateDeliveryStatus = async (deliveryId, status, endTime) => {
    try {
        // Check if deliveryId, status, and endTime are valid
        if (!deliveryId || !status || !endTime) {
            throw new Error('Delivery ID, status, or endTime is missing');
        }

        const url = `${DELIVERY_STATUS_API_URL}/${deliveryId}/wss`;
        console.log('Sending PUT request to:', url, 'with status:', status, 'and end_time:', endTime);

        const response = await axios.put(url, { status, end_time: endTime });

        // Check the response
        console.log('Received response:', response);

        if (response.status === 200) {
            console.log('Delivery status updated successfully');
        }

        return { status: response.status, ...response.data };
    } catch (error) {
        console.error('Error during API request:', error);

        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
        }

        return handleApiError(error);
    }
};


export const closeDelivery = async (deliveryId, success, failureReason) => {
    try {
        const response = await axios.put(`${DELIVERY_API_URL}/${deliveryId}/close`, { success, failureReason });
        return { status: response.status, ...response.data };
    } catch (error) {
        return handleApiError(error);
    }
};

const handleApiError = (error) => {
    if (axios.isAxiosError(error)) {
        // If there is a response from the server, show the response data
        if (error.response) {
            console.error('Axios error:', error.response.data);
            return {
                status: error.response.status || 500,
                message: error.response.data?.message || 'Unknown error occurred.',
            };
        } else {
            // In case of network error or other error without a response
            console.error('Axios error without response:', error.message);
            return {
                status: 500,
                message: 'Network error or no response from server.',
            };
        }
    }

    // Handle unexpected errors
    console.error('Unexpected error:', error);
    return {
        status: 500,
        message: 'Internal server error.',
    };
};

export const getDeviceStatus = async (deviceId) => {
    try {
        if (!deviceId) {
            throw new Error("Device ID is required.");
        }
        const response = await axios.get(`${DEVICE_API_URL}/${deviceId}`);
        console.log('Device status response:', response.data);

        // Assuming the status is in response.data.status
        const deviceStatus = response.data.status;

        // Return 'Active' or 'Inactive' based on the device status
        if (deviceStatus === 'active') {
            return { status: 'Active' };
        } else {
            return { status: 'Inactive' };
        }
    } catch (error) {
        return handleApiError(error);
    }
};

export const updateDeviceStatus = async (deviceId: string, data: Partial<IDevice>) => {
    try {
      const url = `${DEVICE_API_URL}/${deviceId}/wss`;
      console.log('Sending PUT request to:', url, 'with data:', data);  // לוג נוסף
  
      const response = await axios.put(url, data);
  
      // בדיקת התשובה
      console.log('Received response:', response);  // לוג נוסף אחרי קבלת התשובה
  
      if (response.status === 200) {
        console.log('Device status updated successfully');
      }
  
      return { status: response.status, ...response.data };
    } catch (error) {
      console.error('Error during API request:', error);  // לוג במקרה של שגיאה
  
      // טיפול בשגיאות בצורה מעמיקה יותר
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
  
      return handleApiError(error);
    }
  };