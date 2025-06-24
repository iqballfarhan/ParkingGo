// src/graphql/queries.js
import { gql } from "@apollo/client";

// User Queries
export const GET_ME = gql`
  query GetMe {
    me {
      _id
      email
      name
      role
      saldo
      avatar
      created_at
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: ID!) {
    getUserById(userId: $userId) {
      _id
      email
      name
      role
      avatar
      created_at
    }
  }
`;

// Parking Queries
export const GET_NEARBY_PARKINGS = gql`
  query GetNearbyParkings(
    $longitude: Float!
    $latitude: Float!
    $maxDistance: Float
    $vehicleType: String
  ) {
    getNearbyParkings(
      longitude: $longitude
      latitude: $latitude
      maxDistance: $maxDistance
      vehicleType: $vehicleType
    ) {
      _id
      name
      address
      location {
        coordinates
      }
      capacity {
        car
        motorcycle
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
      }
      operational_hours {
        open
        close
      }
      facilities
      images
      rating
      review_count
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
      location {
        coordinates
      }
      owner {
        _id
        name
        email
      }
      capacity {
        car
        motorcycle
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
      }
      operational_hours {
        open
        close
      }
      facilities
      images
      rating
      review_count
      status
      created_at
    }
  }
`;

export const SEARCH_PARKINGS = gql`
  query SearchParkings($query: String!, $vehicleType: String, $sortBy: String) {
    searchParkings(query: $query, vehicleType: $vehicleType, sortBy: $sortBy) {
      _id
      name
      address
      location {
        coordinates
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
      }
      rating
      review_count
      images
    }
  }
`;

export const GET_MY_PARKINGS = gql`
  query GetMyParkings {
    getMyParkings {
      _id
      name
      address
      location {
        type
        coordinates
      }
      owner_id
      capacity {
        car
        motorcycle
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
      }
      operational_hours {
        open
        close
      }
      facilities
      images
      status
      rating
      review_count
      created_at
      updated_at
    }
  }
`;

export const GET_MY_PARKING_LOTS = gql`
  query GetMyParkingLots {
    getMyParkingLots {
      _id
      name
      description
      address
      location {
        type
        coordinates
      }
      total_slots
      available_slots
      tariff
      vehicle_types
      amenities
      operating_hours {
        open
        close
      }
      images
      status
      rating
      created_at
    }
  }
`;

export const GET_PARKING_BOOKINGS = gql`
  query GetParkingBookings($parking_id: ID!) {
    getParkingBookings(parking_id: $parking_id) {
      _id
      user {
        _id
        name
      }
      parking {
        _id
        name
      }
      vehicle_type
      entry_time
      exit_time
      status
      payment {
        _id
        amount
        status
      }
    }
  }
`;

// Parking Lot Queries
export const GET_NEARBY_PARKING_LOTS = gql`
  query GetNearbyParkingLots(
    $longitude: Float!
    $latitude: Float!
    $maxDistance: Float
    $vehicleType: String
  ) {
    getNearbyParkings(
      longitude: $longitude
      latitude: $latitude
      maxDistance: $maxDistance
      vehicleType: $vehicleType
    ) {
      _id
      name
      address
      location {
        coordinates
      }
      capacity {
        car
        motorcycle
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
      }
      operational_hours {
        open
        close
      }
      facilities
      images
      rating
      review_count
      status
      distance
    }
  }
`;

export const SEARCH_PARKING_LOTS = gql`
  query SearchParkingLots($input: SearchParkingInput!) {
    searchParkingLots(input: $input) {
      _id
      name
      description
      address
      location {
        type
        coordinates
      }
      total_slots
      available_slots
      tariff
      vehicle_types
      amenities
      operating_hours {
        open
        close
      }
      images
      status
      rating
      distance
    }
  }
`;

export const GET_PARKING_LOT = gql`
  query GetParkingLot($id: ID!) {
    getParking(id: $id) {
      _id
      name
      address
      location {
        coordinates
      }
      owner {
        _id
        name
        email
        avatar
      }
      capacity {
        car
        motorcycle
      }
      available {
        car
        motorcycle
      }
      rates {
        car
        motorcycle
      }
      operational_hours {
        open
        close
      }
      facilities
      images
      rating
      review_count
      status
      created_at
    }
  }
`;

// Booking Queries
export const GET_BOOKING = gql`
  query GetBooking($id: ID!) {
    getBooking(id: $id) {
      _id
      user {
        _id
        name
        email
      }
      parking {
        _id
        name
        address
        images
        rating
        owner {
          _id
          name
          email
          avatar
        }
      }
      vehicle_type
      start_time
      duration
      cost
      status
      qr_code
      entry_qr
      exit_qr
      created_at
      confirmedAt
      completedAt
      cancelledAt
    }
  }
`;

export const GET_MY_ACTIVE_BOOKINGS = gql`
  query GetMyActiveBookings {
    getMyActiveBookings {
      _id
      parking {
        _id
        name
        address
        images
      }
      vehicle_type
      start_time
      duration
      cost
      status
      created_at
    }
  }
`;

export const GET_MY_BOOKING_HISTORY = gql`
  query GetMyBookingHistory {
    getMyBookingHistory {
      _id
      parking {
        _id
        name
        address
        images
      }
      vehicle_type
      start_time
      duration
      cost
      status
      created_at
    }
  }
`;

// Payment Queries
export const GET_MY_PAYMENT_HISTORY = gql`
  query GetMyPaymentHistory {
    getMyPaymentHistory {
      _id
      transaction_id
      payment_method
      amount
      status
      created_at
    }
  }
`;

export const GET_MY_SALDO_TRANSACTIONS = gql`
  query GetMySaldoTransactions {
    getMySaldoTransactions {
      _id
      type
      amount
      payment_method
      status
      transaction_id
      description
      created_at
    }
  }
`;

export const GET_BOOKING_PAYMENT = gql`
  query GetBookingPayment($bookingId: ID!) {
    getBookingPayment(bookingId: $bookingId) {
      _id
      transaction_id
      payment_method
      amount
      status
      qr_code_url
      created_at
    }
  }
`;

export const GET_TRANSACTIONS = gql`
  query GetTransactions($limit: Int) {
    getMyTransactionHistory(limit: $limit) {
      _id
      type
      payment_method
      amount
      status
      created_at
      description
    }
  }
`;

export const GET_PAYMENT_METHODS = gql`
  query GetPaymentMethods {
    getPaymentMethods {
      id
      name
      type
      lastFour
      isDefault
    }
  }
`;

// Chat & Room Queries (WhatsApp-like functionality)
export const GET_ROOM_MESSAGES = gql`
  query GetRoomMessages($room_id: ID!, $limit: Int) {
    getRoomMessages(room_id: $room_id, limit: $limit) {
      _id
      sender {
        _id
        name
        avatar
        role
      }
      message
      message_type
      read_by
      created_at
    }
  }
`;

export const GET_PRIVATE_ROOM_WITH_USER = gql`
  query GetPrivateRoomWithUser($userId: ID!, $parkingId: ID) {
    getPrivateRoomWithUser(user_id: $userId, parking_id: $parkingId) {
      _id
      name
      type
      privacy
      participants {
        _id
        name
        avatar
        role
      }
      participant_count
      created_at
    }
  }
`;

export const GET_USERS_BY_ROLE = gql`
  query GetUsersByRole($role: String!) {
    getUsersByRole(role: $role) {
      _id
      name
      email
      avatar
      role
    }
  }
`;

export const GET_ALL_LANDOWNERS = gql`
  query GetAllLandowners {
    getUsersByRole(role: "landowner") {
      _id
      name
      email
      avatar
      role
      created_at
      is_email_verified
    }
  }
`;

// Notification Queries
export const GET_MY_NOTIFICATIONS = gql`
  query GetMyNotifications($limit: Int) {
    getMyNotifications(limit: $limit) {
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

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount {
    getUnreadNotificationCount
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($filter: String) {
    getMyNotifications(filter: $filter) {
      _id
      title
      message
      type
      is_read
      data
      created_at
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($notificationId: ID!) {
    markNotificationAsRead(id: $notificationId) {
      _id
      is_read
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      count
    }
  }
`;

// Dashboard Queries
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      walletChange
      totalParkingLots
      parkingLotsChange
      monthlyEarnings
      earningsChange
      activeBookings
      bookingsChange
      totalUsers
      usersChange
      platformRevenue
      revenueChange
      pendingApprovals
      totalBookings
      totalSpent
      spentChange
    }
  }
`;

export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($limit: Int) {
    getRecentActivity(limit: $limit) {
      id
      type
      title
      description
      timestamp
      location
      bookingId
      parkingId
      chatId
    }
  }
`;

export const GENERATE_BOOKING_QR = gql`
  mutation GenerateBookingQR($bookingId: ID!) {
    generateBookingQR(bookingId: $bookingId) {
      _id
      qrCode
    }
  }
`;

// Room Queries
export const GET_MY_ROOMS = gql`
  query GetMyRooms {
    getMyRooms {
      _id
      name
      type
      privacy
      creator_id
      max_participants
      is_full
      parking_id
      participant_count
      participants {
        _id
        name
        avatar
        role
      }
      last_message {
        _id
        message
        created_at
      }
      created_at
      updated_at
    }
  }
`;

export const GET_PUBLIC_ROOMS = gql`
  query GetPublicRooms($limit: Int, $parkingId: ID) {
    getPublicRooms(limit: $limit, parking_id: $parkingId) {
      _id
      name
      type
      privacy
      creator {
        _id
        name
      }
      max_participants
      participant_count
      is_full
      parking_id
      created_at
    }
  }
`;

export const GENERATE_PARKING_ACCESS_QR = gql`
  mutation GenerateParkingAccessQR($bookingId: ID!, $type: String!) {
    generateParkingAccessQR(bookingId: $bookingId, type: $type)
  }
`;
