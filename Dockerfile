# STAGE 1: builder - สร้าง production build
# ใช้ Node.js v20 ซึ่งเข้ากันได้กับ Next.js และ React เวอร์ชันใหม่ๆ
FROM node:20-alpine AS builder
WORKDIR /app

# ติดตั้งเครื่องมือที่จำเป็นสำหรับ Prisma
RUN apk add --no-cache openssl

# คัดลอก package.json และ lock file
COPY package.json package-lock.json* ./

# ติดตั้ง dependencies ทั้งหมดเพื่อใช้ในการ build
RUN npm install

# คัดลอกโค้ดทั้งหมด
COPY . .

# สร้าง Prisma Client (จำเป็นสำหรับ production build)
# และทำการ build โปรเจกต์
RUN npx prisma generate
RUN npm run build

# STAGE 2: runner - รัน production server
FROM node:20-alpine AS runner
WORKDIR /app

# ตั้งค่า environment เป็น production
ENV NODE_ENV production

# คัดลอก package.json และ lock file
COPY package.json package-lock.json* ./

# ติดตั้งเฉพาะ production dependencies เพื่อให้ image มีขนาดเล็ก
RUN npm install --production

# คัดลอก production build, public assets, และ prisma schema จาก stage builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Expose port 3000
EXPOSE 3000

# คำสั่งสำหรับรัน Production server
CMD ["npm", "start"]