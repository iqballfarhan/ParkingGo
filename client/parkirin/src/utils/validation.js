import * as yup from 'yup';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Phone number validation regex (Indonesia)
const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;

// Vehicle plate number validation regex (Indonesia)
const plateNumberRegex = /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$/;

export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

export const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be no more than 50 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .matches(
      passwordRegex,
      'Password must contain at least 8 characters including uppercase, lowercase, number, and special character'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Password confirmation does not match')
    .required('Password confirmation is required'),
  role: yup
    .string()
    .oneOf(['user', 'landowner'], 'Invalid role')
    .required('Role must be selected'),
});

export const bookingSchema = yup.object({
  vehicleType: yup
    .string()
    .oneOf(['car', 'motorcycle'], 'Invalid vehicle type')
    .required('Vehicle type must be selected'),
  plateNumber: yup
    .string()
    .matches(plateNumberRegex, 'Invalid plate number')
    .required('Plate number is required'),
  startTime: yup
    .date()
    .min(new Date(), 'Start time cannot be in the past')
    .required('Start time is required'),
  duration: yup
    .number()
    .min(1, 'Duration must be at least 1 hour')
    .max(24, 'Duration cannot exceed 24 hours')
    .required('Duration is required'),
});

export const profileSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be no more than 50 characters')
    .required('Name is required'),
  phone: yup
    .string()
    .matches(phoneRegex, 'Invalid phone number')
    .required('Phone number is required'),
  address: yup
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be no more than 200 characters')
    .required('Address is required'),
});

export const parkingLotSchema = yup.object({
  name: yup
    .string()
    .min(3, 'Nama tempat parkir minimal 3 karakter')
    .max(100, 'Nama tempat parkir maksimal 100 karakter')
    .required('Nama tempat parkir wajib diisi'),
  address: yup
    .string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(200, 'Alamat maksimal 200 karakter')
    .required('Alamat wajib diisi'),
  description: yup
    .string()
    .min(20, 'Deskripsi minimal 20 karakter')
    .max(500, 'Deskripsi maksimal 500 karakter')
    .required('Deskripsi wajib diisi'),
  totalSlots: yup
    .number()
    .min(1, 'Jumlah slot minimal 1')
    .required('Jumlah slot wajib diisi'),
  tariff: yup
    .number()
    .min(1000, 'Tarif minimal Rp 1.000')
    .required('Tarif wajib diisi'),
  operationalHours: yup.object({
    open: yup.string().required('Jam buka wajib diisi'),
    close: yup.string().required('Jam tutup wajib diisi'),
  }),
  facilities: yup
    .array()
    .of(yup.string())
    .min(1, 'Minimal pilih 1 fasilitas'),
  photos: yup
    .array()
    .of(yup.string())
    .min(1, 'Minimal upload 1 foto')
    .max(5, 'Maksimal 5 foto'),
}); 