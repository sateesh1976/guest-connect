import { useState, useMemo } from 'react';
import { Search, Users, Home, Phone, Mail, Building2, Filter, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSocietyMembers } from '@/hooks/useSocietyMembers';

const MemberDirectory = () => {
  const { members, isLoading, refetch } = useSocietyMembers();
  const [search, setSearch] = useState('');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [wingFilter, setWingFilter] = useState<string>('all');

  const clusters = useMemo(() => {
    const set = new Set(members.map(m => m.cluster_name).filter(Boolean));
    return Array.from(set).sort();
  }, [members]);

  const wings = useMemo(() => {
    const set = new Set(members.map(m => m.wing).filter(Boolean));
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter(m => {
      const matchSearch = !search || 
        m.member_name.toLowerCase().includes(search.toLowerCase()) ||
        m.flat_no.toLowerCase().includes(search.toLowerCase()) ||
        m.contact_number?.includes(search) ||
        m.email_address?.toLowerCase().includes(search.toLowerCase());
      const matchCluster = clusterFilter === 'all' || m.cluster_name === clusterFilter;
      const matchWing = wingFilter === 'all' || m.wing === wingFilter;
      return matchSearch && matchCluster && matchWing;
    });
  }, [members, search, clusterFilter, wingFilter]);

  const stats = useMemo(() => ({
    total: members.length,
    owners: members.filter(m => m.ownership_type === 'Owner').length,
    tenants: members.filter(m => m.ownership_type === 'Tenant').length,
  }), [members]);

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Member Directory</h1>
          <p className="text-muted-foreground">Society members and flat owners</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-elevated p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Members</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Home className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Owners</p>
            <p className="text-2xl font-semibold">{stats.owners}</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Building2 className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tenants</p>
            <p className="text-2xl font-semibold">{stats.tenants}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, flat, phone, email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={clusterFilter} onValueChange={setClusterFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Cluster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clusters</SelectItem>
            {clusters.map(c => (
              <SelectItem key={c} value={c!}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={wingFilter} onValueChange={setWingFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Wing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wings</SelectItem>
            {wings.map(w => (
              <SelectItem key={w} value={w!}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Member List */}
      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium text-foreground mb-1">No members found</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Try a different search term' : 'No members have been added yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((member) => (
            <div key={member.id} className="card-elevated p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {member.member_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{member.member_name}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {member.cluster_name} {member.wing}-{member.flat_no}
                    </span>
                    {member.contact_number && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {member.contact_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-14 sm:pl-0">
                <Badge variant={member.ownership_type === 'Owner' ? 'default' : 'secondary'}>
                  {member.ownership_type}
                </Badge>
                {member.role && member.role !== 'Member' && (
                  <Badge variant="outline">{member.role}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default MemberDirectory;
