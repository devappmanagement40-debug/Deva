import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ShareInformationPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const proofInput = useRef<HTMLInputElement>(null);
  const [shareLink, setShareLink] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [proofName, setProofName] = useState("");
  const submitShareReport = useMutation({
    mutationFn: async (payload: { shareLink: string; proof: string }) => {
      const response = await apiRequest("POST", "/api/share-reports", payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Unable to submit your share information.");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submitted",
        description: "Your share information has been submitted.",
      });
      setShareLink("");
      setProof(null);
      setProofName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const chooseProof = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Image required",
        description: "Please select an image as your share proof.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "The share proof must be smaller than 3 MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProof(String(reader.result));
      setProofName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!shareLink.trim() || !proof) {
      toast({
        title: "Information required",
        description: "Please enter your share link and upload your share proof.",
        variant: "destructive",
      });
      return;
    }
    submitShareReport.mutate({ shareLink: shareLink.trim(), proof });
  };

  return (
    <main
      className="min-h-screen w-full overflow-x-clip bg-[#f5f5f5] text-[#333]"
      data-testid="page-share-information"
    >
      <header className="flex h-[139px] items-center gap-[22px] bg-[#f5f5f5] px-7 pt-[31px]">
        <button
          type="button"
          onClick={() => navigate("/account")}
          className="flex h-10 w-8 shrink-0 items-center justify-center active:scale-95"
          aria-label="Back"
          data-testid="button-share-information-back"
        >
          <ArrowLeft size={32} strokeWidth={1.8} />
        </button>
        <h1 className="font-normal leading-none text-[#111]" style={{ fontSize: 20 }}>
          Share Information
        </h1>
      </header>

      <form onSubmit={submit}>
        <section
          className="relative mx-5 h-[330px] rounded-[11px] bg-white shadow-[0_1px_4px_rgba(0,0,0,.035)]"
          aria-label="Share information form"
        >
          <label className="absolute left-5 right-5 top-[22px] block">
            <span className="block font-semibold leading-6 text-[#3a3a3a]" style={{ fontSize: 19 }}>
              <span className="text-[#e94b55]">*</span> Share link
            </span>
            <input
              type="text"
              inputMode="url"
              value={shareLink}
              onChange={(event) => setShareLink(event.target.value)}
              placeholder="Please enter your share link"
              className="absolute left-0 top-[42px] h-[35px] w-full border-0 border-b border-[#eeeeee] bg-transparent px-0 text-[#333] outline-none placeholder:text-[#6d6d6d]"
              style={{ fontSize: 19 }}
              data-testid="input-share-link"
            />
          </label>

          <div className="absolute left-5 right-5 top-[121px]">
            <p className="font-semibold leading-6 text-[#3a3a3a]" style={{ fontSize: 19 }}>
              <span className="text-[#e94b55]">*</span> Share proof
            </p>
            <input
              ref={proofInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={chooseProof}
            />
            <button
              type="button"
              onClick={() => proofInput.current?.click()}
              className="absolute left-0 top-[43px] flex h-[123px] w-full items-center justify-center rounded-[11px] border-2 border-dashed border-[#d2d4d8] text-[#a1a5ae] active:opacity-75"
              data-testid="button-upload-share-proof"
            >
              {proof ? (
                <span className="flex max-w-[90%] items-center gap-3">
                  <img src={proof} alt="Selected share proof" className="h-[86px] max-w-[150px] rounded object-cover" />
                  <span className="max-w-[150px] truncate text-[16px]">{proofName}</span>
                </span>
              ) : (
                <span className="flex items-center gap-3" style={{ fontSize: 17 }}>
                  <Camera size={28} fill="#a1a5ae" strokeWidth={1.5} />
                  Click to upload
                </span>
              )}
            </button>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitShareReport.isPending}
          className="mx-auto mt-5 flex h-[45px] w-[66.3%] items-center justify-center rounded-[23px] bg-[#1285ed] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,.08)] transition active:scale-[.99] disabled:opacity-70"
          style={{ fontSize: 18 }}
          data-testid="button-submit-share-information"
        >
          {submitShareReport.isPending ? "Submitting…" : "Submit"}
        </button>
      </form>
    </main>
  );
}