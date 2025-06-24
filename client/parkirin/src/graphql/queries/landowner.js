import { gql } from '@apollo/client';

export const GET_ME = gql`
  query Me {
    me {
      _id
      email
      name
      role
      saldo
      avatar
      is_email_verified
      created_at
    }
  }
`;

export const GET_MY_ACTIVE_BOOKINGS = gql`
  query GetMyActiveBookings {
    getMyActiveBookings {
      _id
      startTime
      duration
      cost
      status
      qrCode
      entryQR
      exitQR
    }
  }
`;

export const GET_MY_PARKINGS = gql`
  query GetMyParkings {
    getMyParkings {
      _id
      name
      status
    }
  }
`;

export const GET_PARKING = gql`
  query GetParking($id: ID!) {
    getParking(id: $id) {
      _id
      name
      address
      description
      status
      capacity {
        car
        motorcycle
      }
      location {
        coordinates
      }
    }
  }
`;

export const GET_PARKING_BOOKINGS = gql`
  query GetParkingBookings($parking_id: ID!) {
    getParkingBookings(parking_id: $parking_id) {
      _id
      user {
        name
      }
      vehicle_type
      status
      payment {
        status
        amount
      }
    }
  }
`; 