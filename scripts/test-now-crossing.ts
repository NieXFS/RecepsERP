import { db } from "../src/lib/db";

async function main() {
  const mode = process.argv[2];
  if (mode !== "create" && mode !== "delete") {
    throw new Error("usage: tsx test-now-crossing.ts create|delete [id]");
  }
  if (mode === "delete") {
    const id = process.argv[3];
    if (!id) throw new Error("delete requires id");
    await db.appointment.delete({ where: { id } });
    console.log("deleted id:", id);
    await db.$disconnect();
    return;
  }

  const prof = await db.professional.findFirst({
    where: { isActive: true, deletedAt: null, specialty: "Esteticista" },
    include: { services: true, user: true },
  });
  if (!prof) throw new Error("no esteticista professional");
  const customer = await db.customer.findFirst({
    where: { tenantId: prof.tenantId, isActive: true, deletedAt: null },
  });
  if (!customer) throw new Error("no customer");
  const service = await db.service.findFirst({
    where: {
      tenantId: prof.tenantId,
      isActive: true,
      deletedAt: null,
      id: { in: prof.services.map((s) => s.serviceId) },
    },
  });
  if (!service) throw new Error("no service");

  // Appointment that crosses the current time: starts 2h before now, ends 1h after.
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  start.setSeconds(0, 0);
  // Round to nearest 30min slot
  const slotMin = 30;
  const minutes = start.getMinutes();
  start.setMinutes(minutes - (minutes % slotMin));
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  end.setSeconds(0, 0);
  const emins = end.getMinutes();
  end.setMinutes(emins - (emins % slotMin));

  const appt = await db.appointment.create({
    data: {
      tenantId: prof.tenantId,
      customerId: customer.id,
      professionalId: prof.id,
      status: "SCHEDULED",
      startTime: start,
      endTime: end,
      totalPrice: service.price,
      services: { create: { serviceId: service.id, price: service.price } },
    },
  });
  console.log(`created id: ${appt.id} ${start.toISOString()}–${end.toISOString()}`);
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
