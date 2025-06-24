export const parkingTypes = `#graphql
  type Location {
    type: String!
    coordinates: [Float!]!
  }

  type Capacity {
    car: Int!
    motorcycle: Int!
  }

  type Available {
    car: Int!
    motorcycle: Int!
  }

  type Rates {
    car: Float
    motorcycle: Float
  }

  type OperationalHours {
    open: String!
    close: String!
  }

  type OwnerStats {
    totalBalance: Float
    currentBalance: Float
    totalIncome: Float
    totalBookings: Int
    averageRating: Float
  }

  type DailyStats {
  date: String!
  revenue: Float!
  bookings: Int!
  occupancyRate: Float!
}

type MonthlyStats {
  month: String!
  revenue: Float!
  bookings: Int!
  averageOccupancy: Float!
}

type VehicleDistribution {
  car: Int!
  motorcycle: Int!
  carPercentage: Float!
  motorcyclePercentage: Float!
}

type ParkingStats {
  parkingId: ID!
  parkingName: String!
  totalRevenue: Float!
  totalBookings: Int!
  averageRating: Float!
  currentOccupancyRate: Float!
  dailyStats: [DailyStats!]!
  monthlyStats: [MonthlyStats!]!
  vehicleDistribution: VehicleDistribution!
  peakHours: [Int!]!
  bestDay: String
  worstDay: String
}


  type Parking {
    _id: ID!
    name: String!
    address: String!
    location: Location!
    owner_id: ID!
    owner: User
    capacity: Capacity!
    available: Available!
    rates: Rates
    operational_hours: OperationalHours!
    facilities: [String!]!
    images: [String!]!
    status: String!
    rating: Float!
    review_count: Int!
    created_at: String!
    updated_at: String!
  }

  input LocationInput {
    coordinates: [Float!]!
  }

  input CapacityInput {
    car: Int!
    motorcycle: Int!
  }

  input RatesInput {
    car: Float!
    motorcycle: Float!
  }

  input OperationalHoursInput {
    open: String!
    close: String!
  }

  input CreateParkingInput {
    name: String!
    address: String!
    location: LocationInput!
    capacity: CapacityInput!
    rates: RatesInput!
    operational_hours: OperationalHoursInput!
    facilities: [String!]!
    images: [String!]!
  }

  input UpdateParkingInput {
    name: String
    address: String
    rates: RatesInput
    operational_hours: OperationalHoursInput
    facilities: [String!]
    images: [String!]
    status: String
  }

  type Query {
    getOwnerStats: OwnerStats 
    getParkingStats(parkingId: ID!): ParkingStats
    getParking(id: ID!): Parking!
    getNearbyParkings(
      longitude: Float!
      latitude: Float!
      maxDistance: Float
      vehicleType: String
    ): [Parking!]!
    getMyParkings: [Parking!]!
    searchParkings(
      query: String!
      vehicleType: String
      sortBy: String
    ): [Parking!]!
  }
  type Mutation {
    createParking(input: CreateParkingInput!): Parking!
    updateParking(id: ID!, input: UpdateParkingInput!): Parking!
    deleteParking(id: ID!): Boolean!
    fixParkingAvailability(parking_id: ID!): Parking!
    updateParkingAvailability(parking_id: ID!): Parking!
  }
`;
