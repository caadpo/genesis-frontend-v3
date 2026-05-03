"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  user?: any;
  onSuccess: (id: number) => void;
};

type Ome = {
  id: number;
  nomeOme: string;
};

export default function UsuariosModal({
  open,
  onClose,
  user,
  onSuccess,
}: Props) {
  const [omes, setOmes] = useState<Ome[]>([]);

  const [nomeGuerra, setNomeGuerra] = useState("");
  const [pg, setPg] = useState("");
  const [mat, setMat] = useState("");
  const [loginSei, setLoginSei] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [nunfunc, setNunfunc] = useState("");
  const [nunvinc, setNunvinc] = useState("");
  const [typeUser, setTypeUser] = useState<number>(1);
  const [omeId, setOmeId] = useState<number>();

  // RESET / PREENCHIMENTO
  useEffect(() => {
    if (user) {
      setNomeGuerra(user.nomeGuerra ?? "");
      setPg(user.pg ?? "");
      setMat(user.mat ?? "");
      setLoginSei(user.loginSei ?? "");
      setPhone(user.phone ?? "");
      setCpf(user.cpf ?? "");
      setNunfunc(user.nunfunc ?? "");
      setNunvinc(user.nunvinc ?? "");
      setTypeUser(user.typeUser ?? 1);
      setOmeId(user.ome?.id);
    } else {
      setNomeGuerra("");
      setPg("");
      setMat("");
      setLoginSei("");
      setPhone("");
      setCpf("");
      setNunfunc("");
      setNunvinc("");
      setTypeUser(1);
      setOmeId(undefined);
    }
  }, [user, open]);

  // carregar OMEs
  useEffect(() => {
    if (open) {
      fetch("/api/ome")
        .then((r) => r.json())
        .then(setOmes);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit() {
    const isEdit = !!user;

    const url = isEdit ? `/api/user/${user.id}` : `/api/user`;
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      nomeGuerra,
      pg,
      mat: Number(mat),
      loginSei,
      phone,
      typeUser,
      omeId: omeId,
      cpf,
      nunfunc,
      nunvinc,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.message || "Erro ao salvar usuário ❌");
      return;
    }

    const data = await res.json();
    toast.success(isEdit ? "Usuário atualizado ✅" : "Usuário criado ✅");
    onSuccess(data.id);

    onClose();
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;

    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)}.${numbers.slice(
      3,
      7
    )}-${numbers.slice(7)}`;
  }

  return (
    <div className="modalUsuarioOverlay">
      <div className="modalUsuarioCard">
        <h2>{user ? "Editar Usuário" : "Novo Usuário"}</h2>
        <div>
          <div style={{ display: "flex", width: "100%" }}>
            <div style={{ width: "50%" }}>
              <label>Posto/Graduação</label>
              <select
                style={{ width: "100%" }}
                value={pg}
                onChange={(e) => setPg(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="SD">SD</option>
                <option value="CB">CB</option>
                <option value="3º SGT">3º SGT</option>
                <option value="2º SGT">2º SGT</option>
                <option value="1º SGT">1º SGT</option>
                <option value="ST">ST</option>
                <option value="ASP">ASP</option>
                <option value="2º TEN">2º TEN</option>
                <option value="1º TEN">1º TEN</option>
                <option value="CAP">CAP</option>
                <option value="MAJ">MAJ</option>
                <option value="TC">TC</option>
                <option value="CEL">CEL</option>
              </select>
            </div>

            <div style={{ width: "50%" }}>
              <label>Matrícula</label>
              <input
                value={mat}
                maxLength={7}
                inputMode="numeric"
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/\D/g, "");
                  if (onlyNumbers.length <= 7) setMat(onlyNumbers);
                }}
              />
            </div>
          </div>

          <div>
            <div>
              <label>Nome de Guerra</label>
            </div>

            <div style={{ width: "100%" }}>
              <input
                style={{ width: "100%" }}
                value={nomeGuerra}
                onChange={(e) => setNomeGuerra(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div>
              <label>Login SEI</label>
            </div>

            <div style={{ width: "100%" }}>
              <input
                style={{ width: "100%" }}
                value={loginSei}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase();
                  const filtered = value.replace(/[^a-z0-9.]/g, "");
                  setLoginSei(filtered);
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", width: "100%" }}>
            <div style={{ width: "50%" }}>
              <label>Organização Militar</label>
              <select
                style={{ width: "100%" }}
                value={omeId ?? ""}
                onChange={(e) => setOmeId(Number(e.target.value))}
              >
                <option value="">Selecione</option>
                {omes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nomeOme}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: "50%" }}>
              <label>Telefone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: "flex", width: "100%" }}>
            <div style={{ width: "50%" }}>
              <label>Cpf:</label>
              <input
                style={{ width: "100%" }}
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>

            <div style={{ width: "50%" }}>
              <label>NunFunc</label>
              <input
                style={{ width: "100%" }}
                value={nunfunc}
                onChange={(e) => setNunfunc(e.target.value)}
              />
            </div>
            <div style={{ width: "50%" }}>
              <label>NunVinc</label>
              <input
                style={{ width: "100%" }}
                value={nunvinc}
                onChange={(e) => setNunvinc(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div>
              <label>Tipo Usuário</label>
            </div>
            <div style={{ width: "100%" }}>
              <select
                style={{ width: "100%" }}
                value={typeUser}
                onChange={(e) => setTypeUser(Number(e.target.value))}
              >
                <option value={1}>Comum</option>
                <option value={2}>Auxiliar</option>
                <option value={3}>Diretor</option>
                <option value={4}>Estrategico</option>
                <option value={5}>Financeiro</option>
                <option value={6}>PD</option>
                <option value={9}>Técnico</option>
                <option value={10}>Master</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modalUsuarioActions">
          <button onClick={onClose} className="btnUsuarioCancel">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btnUsuarioSave">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
