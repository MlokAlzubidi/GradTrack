
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            unique: true,
            sparse: true,
            default: undefined,
            trim: true,
            lowercase: true,
            set: value => {
                if (typeof value !== "string") return value ?? undefined;

                const normalized = value.trim().toLowerCase();
                return normalized || undefined;
            },
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
        },

        universityId: {
            type: String,
            trim: true,
            required: function () {
                return this.role === "student";
            }
        },

        staffId: {
            type: String,
            trim: true,
            uppercase: true,
            required: function () {
                return this.role === "supervisor";
            }
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        role: {
            type: String,
            enum: ["student", "supervisor"],
            required: true
        },

       isActive: {
    type: Boolean,
    default: true
},

tokenVersion: {
    type: Number,
    default: 0
}
    },
    {
        timestamps: true
    }
);

// Unique university ID for students
userSchema.index(
    { universityId: 1 },
    {
        unique: true,
        partialFilterExpression: { role: "student" }
    }
    
 
);



// Unique staff ID for supervisors
userSchema.index(
    { staffId: 1 },
    {
        unique: true,
        partialFilterExpression: { role: "supervisor" }
    }
);

// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
