import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
        setName(data?.full_name || "");
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name })
        .eq('id', profile.id);
      if (error) throw error;
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar must be smaller than 2MB');
      return;
    }
    const filePath = `avatars/${profile.id}/${Date.now()}-${file.name}`;
    setLoading(true);
    try {
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        metadata: { owner: profile.id }
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;
      setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
      toast.success('Avatar uploaded');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="text-center py-8">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar userRole={profile.role} userName={profile.full_name} />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="w-40 h-40 rounded-full overflow-hidden bg-muted/20 flex items-center justify-center mb-4">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-muted-foreground">No avatar</div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">Full name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mb-4" />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>{loading ? '...' : 'Save'}</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
