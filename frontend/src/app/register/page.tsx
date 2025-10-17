"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

enum UserRole {
  Student = 0,
  Teacher = 1,
}

type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole; // 0 = student, 1 = teacher
  groupClass?: string;
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RegisterFormData>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const selectedRole = watch("role"); // 👈 watch for role changes

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        role: Number(data.role),
        groupClass: data.role === UserRole.Teacher ? "" : data.groupClass || "",
      };

      console.log("Sending data:", payload);

      const res = await fetch("http://localhost:5050/api/Auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      console.log("Response:", responseData);

      if (!res.ok) {
        alert(responseData.message || "Registration failed");
        return;
      }

      localStorage.setItem("token", responseData.token);
      localStorage.setItem("user", JSON.stringify(responseData));
      window.dispatchEvent(new Event("authChanged"));
      alert("Registration successful!");
      reset();
      router.push("/");
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="border border-gray-200 shadow-md rounded-2xl p-8 w-full max-w-md bg-white">
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-900">
          Create an Account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                {...register("firstName", { required: "First name is required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                {...register("lastName", { required: "Last name is required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Role</label>
            <select
              {...register("role", { required: "Select a role" })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Select role</option>
              <option value={UserRole.Student}>Student</option>
              <option value={UserRole.Teacher}>Teacher</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* ✅ Only show Group/Class if role is Student */}
          {Number(selectedRole) === UserRole.Student && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Group/Class
              </label>
              <input
                type="text"
                {...register("groupClass")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="CSE-2025"
              />
              {errors.groupClass && (
                <p className="text-red-500 text-sm mt-1">{errors.groupClass.message}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}