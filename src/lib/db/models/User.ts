import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type UserRole = 'client' | 'insurer' | 'admin';

export interface IUserProfile {
    fullNameLatin: string;
    fullNameArabic: string;
    birthDate: string;
    birthPlace: string;
    fatherName: string;
    phone: string;
    address: string;
    expiryDate?: string;
}

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    cin: string;
    role: UserRole;
    dossierId: string;
    profile: IUserProfile;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        passwordHash: { type: String, required: true, select: false },
        cin: { type: String, required: true, unique: true, trim: true, index: true },
        role: { type: String, enum: ['client', 'insurer', 'admin'], default: 'client' },
        dossierId: { type: String, required: true, index: true },
        profile: {
            fullNameLatin: { type: String, default: '' },
            fullNameArabic: { type: String, default: '' },
            birthDate: { type: String, default: '' },
            birthPlace: { type: String, default: '' },
            fatherName: { type: String, default: '' },
            phone: { type: String, default: '' },
            address: { type: String, default: '' },
            expiryDate: { type: String, default: '' },
        },
    },
    { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export type SafeUser = {
    id: string;
    email: string;
    cin: string;
    role: UserRole;
    dossierId: string;
    profile: IUserProfile;
    createdAt: string;
};

export function toSafeUser(user: IUser): SafeUser {
    return {
        id: user._id.toString(),
        email: user.email,
        cin: user.cin,
        role: user.role,
        dossierId: user.dossierId,
        profile: user.profile,
        createdAt: user.createdAt.toISOString(),
    };
}
