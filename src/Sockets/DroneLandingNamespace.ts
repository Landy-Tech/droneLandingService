import { Socket, Server as SocketIOServer } from 'socket.io';
import { newDelivery, updateDeliveryStatus, closeDelivery, updateDeviceStatus } from './deliveryApi';

const activeSockets = new Map<string, { socket: Socket, deliveryId: string }>(); // ניהול סוקטים פעילים לפי מזהה המשלוח

export const setupDeliveryNamespace = (io: SocketIOServer) => {
    io.of('/drone-landing').on('connection', (socket: Socket) => {
        console.log('A client connected:', socket.id);

        socket.on('NEW_DELIVERY', async (data) => {
            try {
                console.log('Handling NEW_DELIVERY:', data);

                const { landAirId, deliveryName } = data;

                if (!landAirId || !deliveryName) {
                    console.log('Invalid data, disconnecting socket.');
                    socket.disconnect(true);
                    return;
                }

                // Check if the device is already active
                if (activeSockets.has(landAirId)) {
                    console.log(`Device ${landAirId} already has an active delivery, disconnecting socket.`);
                    socket.emit('disconnectMessage', {
                        status: 400,
                        value: 'Device already has an active delivery',
                    });
                    socket.disconnect(true);
                    return;
                }

                // Proceed with new delivery
                const delivery = await newDelivery({ landAirId, deliveryName });

                // Check if the delivery object contains 'deliveryId'
                if ('deliveryId' in delivery) {
                    if (delivery.status !== 201 || !delivery.deliveryId) {
                        console.log(`Delivery failed with status ${delivery.status}`);
                        socket.emit('disconnectMessage', {
                            status: delivery.status,
                            value: `Delivery process not started successfully`,
                        });
                        return;
                    }

                    // Add the new delivery to the map
                    activeSockets.set(landAirId, { socket, deliveryId: delivery.deliveryId });
                    console.log('Active sockets after new delivery:', Array.from(activeSockets.entries())); // לוג נוסף

                    socket.emit('deliveryStarted', {
                        status: 201,
                        value: 'Delivery started successfully',
                        deliveryId: delivery.deliveryId,
                    });
                } else {
                    // Handle the case where 'deliveryId' is not present
                    console.log(`Unexpected response structure:`, delivery);
                    socket.emit('disconnectMessage', {
                        status: 500,
                        value: 'Unexpected response structure from the delivery API.',
                    });
                }
            } catch (error) {
                console.error('Error processing NEW_DELIVERY:', error);
                socket.emit('errorMessage', { status: 500, value: 'Internal server error.' });
            }
        });


        // Handle FINISH_DELIVERY event (Success/Failure)
        socket.on('FINISH_DELIVERY', async (data) => {
            try {
                const { success, failureReason } = data;
                
                // Find the active delivery for this socket
                const activeSocketEntry = Array.from(activeSockets.entries()).find(
                    ([, value]) => value.socket.id === socket.id
                );
                
                if (activeSocketEntry) {
                    const [landAirId, socketData] = activeSocketEntry;
                    const { deliveryId } = socketData;
                    console.log('Found deliveryId:', deliveryId);
        
                    const deliveryStatus = success ? 'Succeeded' : 'Failed';
                    
                    // Get the current time as end_time
                    const endTime = new Date().toISOString();
        
                    // Update delivery status in DB
                    const updateResult = await updateDeliveryStatus(deliveryId, deliveryStatus, endTime);
                    console.log(updateResult);
        
                    if (updateResult.status === 200) {
                        console.log(`Delivery ${deliveryId} status updated to ${deliveryStatus}`);
        
                        // Send automatic update to the client
                        socket.emit('statusUpdate', {
                            status: 200,
                            value: `Delivery ${deliveryStatus} successfully`,
                        });
        
                        const deviceUpdateResult = await updateDeviceStatus(landAirId, { status: 'Active' });
        
                        if (deviceUpdateResult.status === 200) {
                            console.log(`Device ${landAirId} status updated to Active`);
                        } else {
                            console.error(`Failed to update device status for ${landAirId}: ${deviceUpdateResult.message}`);
                        }
                    } else {
                        console.error(`Failed to update delivery status for ${deliveryId}: ${updateResult.message}`);
                        socket.emit('statusUpdate', {
                            status: 500,
                            value: 'Failed to update delivery status',
                        });
                    }
        
                    // Remove the delivery from the active map
                    activeSockets.delete(landAirId);
                    console.log(`Removed delivery ${deliveryId} for device ${landAirId} from active deliveries`);
                } else {
                    console.log('No active delivery found for this socket');
                    socket.emit('errorMessage', { status: 404, value: 'No active delivery found for this socket.' });
                }
            } catch (error) {
                console.error('Error finishing delivery:', error);
                socket.emit('errorMessage', { status: 500, value: 'Error finishing delivery' });
            }
        });
        


        // Handle disconnect event
        socket.on('disconnect', () => {
            // Remove the socket from the map
            activeSockets.forEach((value, key) => {
                if (value.socket.id === socket.id) {
                    activeSockets.delete(key);
                    console.log(`Removed delivery ${value.deliveryId} for device ${key} from active sockets`);
                }
            });
            console.log('Client disconnected:', socket.id);
        });
    });
};
