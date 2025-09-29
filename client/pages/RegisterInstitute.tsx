import React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { getInstitute, saveInstitute, type Institute } from "@/lib/account";

export default function RegisterInstitutePage() {
  const [inst, setInst] = React.useState<Institute | null>(() =>
    getInstitute(),
  );
  const [form, setForm] = React.useState<Institute>(
    () =>
      inst || {
        name: "",
        type: "School",
        address: "",
        city: "",
        contactEmail: "",
        contactPhone: "",
        teachersCount: undefined,
        website: "",
        registeredAt: Date.now(),
      },
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Institute = {
      ...form,
      registeredAt: inst?.registeredAt || Date.now(),
    };
    saveInstitute(payload);
    setInst(payload);
    toast({
      title: inst ? "Institute updated" : "Institute registered",
      description: inst
        ? "Details updated successfully."
        : "Your institute has been registered.",
    });
  };

  return (
    <div className="min-h-svh">
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-4">
              <SidebarPanelInner />
            </div>
          </aside>

          <div>
            <div className="rounded-xl bg-white p-6 border border-input card-yellow-shadow -mt-5">
              <h2 className="text-2xl font-bold">Register Institute</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Provide institute details for licensing and billing.
              </p>

              <form onSubmit={onSubmit} className="mt-4 space-y-4 max-w-2xl">
                <div className="grid gap-2">
                  <Label htmlFor="name">Institute name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g., City Public School"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="School">School</SelectItem>
                      <SelectItem value="College">College</SelectItem>
                      <SelectItem value="University">University</SelectItem>
                      <SelectItem value="Institute">Institute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder="Street, Area"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    placeholder="Karachi"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactEmail">Contact email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contactEmail: e.target.value }))
                    }
                    placeholder="admin@school.edu"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone">Contact phone</Label>
                  <Input
                    id="contactPhone"
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, contactPhone: e.target.value }))
                    }
                    placeholder="03XX-XXXXXXX"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="teachersCount">Teachers count</Label>
                  <Input
                    id="teachersCount"
                    type="number"
                    value={form.teachersCount ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        teachersCount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="25"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, website: e.target.value }))
                    }
                    placeholder="https://example.edu"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit">
                    {inst ? "Update details" : "Register"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
