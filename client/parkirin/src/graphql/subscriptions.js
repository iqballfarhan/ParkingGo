// src/graphql/subscriptions.js
import { gql } from '@apollo/client';

// Booking Subscriptions
export const BOOKING_STATUS_CHANGED = gql`
  subscription BookingStatusChanged($parkingId: ID!) {
    bookingStatusChanged(parking_id: $parkingId) {
      _id
      status
      updated_at
    }
  }
`;

// Payment Subscriptions
export const PAYMENT_STATUS_CHANGED = gql`
  subscription PaymentStatusChanged($bookingId: ID!) {
    paymentStatusChanged(bookingId: $bookingId) {
      _id
      status
      updated_at
    }
  }
`;

export const SALDO_UPDATED = gql`
  subscription SaldoUpdated($userId: ID!) {
    saldoUpdated(userId: $userId) {
      _id
      type
      amount
      status
      created_at
    }
  }
`;

// Chat Subscriptions
export const MESSAGE_RECEIVED = gql`
  subscription MessageReceived($room_id: ID!) {
    messageReceived(room_id: $room_id) {
      _id
      sender {
        _id
        name
        avatar
      }
      room {
        _id
        name
      }
      message
      message_type
      read_by
      created_at
      updated_at
    }
  }
`;

export const MESSAGE_SENT = gql`
  subscription MessageReceived($room_id: ID!) {
    messageReceived(room_id: $room_id) {
      _id
      sender {
        _id
        name
        avatar
      }
      room {
        _id
        name
      }
      message
      message_type
      read_by
      created_at
      updated_at
    }
  }
`;

export const MESSAGE_STATUS_UPDATED = gql`
  subscription MessageStatusUpdated($roomId: ID!) {
    messageStatusUpdated(room_id: $roomId) {
      message_id
      read_by
      delivered_to
    }
  }
`;

// Notification Subscriptions
export const NOTIFICATION_RECEIVED = gql`
  subscription NotificationReceived {
    notificationReceived {
      _id
      type
      title
      message
      data
      is_read
      created_at
    }
  }
`;

// Parking Subscriptions
export const PARKING_AVAILABILITY_CHANGED = gql`
  subscription ParkingAvailabilityChanged($parkingId: ID!) {
    parkingAvailabilityChanged(parkingId: $parkingId) {
      _id
      available {
        car
        motorcycle
      }
      updated_at
    }
  }
`;

// Room Subscriptions
export const ROOM_UPDATED = gql`
  subscription RoomUpdated($userId: ID!) {
    roomUpdated(userId: $userId) {
      _id
      name
      type
      privacy
      participants {
        _id
        name
        avatar
      }
      last_message {
        _id
        message
        created_at
        sender {
          _id
          name
        }
      }
      participant_count
      updated_at
    }
  }
`;
