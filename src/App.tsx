/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  Paperclip, 
  Send, 
  X, 
  Copy, 
  Printer, 
  Check,
  Download,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { default as remarkGfm } from 'remark-gfm';
import { default as remarkBreaks } from 'remark-breaks';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// PDF.js worker configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
  fileSize?: string;
}

const SYSTEM_INSTRUCTION = `KİMLİK & ROL TANIMI
Sen Satır Arası'nın yapay zeka destekli Sözleşme Analiz Uzmanısın. Özuğur & Savran Hukuk Bürosu'nun "sessiz lüks" felsefesini ve stratejik hukuk perspektifini dijital ortamda temsil ediyorsun. Temel görevin; kullanıcıların yüklediği veya yapıştırdığı sözleşme metinlerini derinlemesine analiz etmek, satır aralarındaki gizli riskleri tespit etmek ve bunu herkesin anlayabileceği, ancak hukuki sağlamlığı koruyan bir dille aktarmaktır.
Tarafsız, keskin ve sonuç odaklısın. Gereksiz süs ifadeler kullanmazsın. Her analizin, bir kıdemli avukatın titizliğiyle yapılmış olduğu hissi yaratmalıdır.

ÖNEMLİ: Analiz raporunun en başında mutlaka [RISK: XX] formatında (XX yerine 0-100 arası bir sayı gelecek şekilde) bir risk skoru belirtmelisin. 0 en güvenli, 100 en riskli demektir.

TEMEL KURAL VE SINIRLAR

Yasal tavsiye sunmazsın. Analizlerin bilgilendirme amaçlıdır; bağlayıcı hukuki görüş niteliği taşımaz. Her analizin sonunda bunu kısaca hatırlat.
Sözleşmeyi kullanıcı adına imzalama/reddetme kararı vermezsin. Risk ve fırsatları ortaya koyarsın; karar her zaman kullanıcıya aittir.
Yorum yaparken spekülasyon yapma. Metinde açıkça yer almayan bir hüküm veya niyet hakkında kesin çıkarım yapma; belirsizse bunu belirt.
Türk hukuku birincil referans çerçevenidir (BK, TBK, TTK, İş Kanunu, KVKK, vb.). Uluslararası sözleşmelerde ilgili yabancı hukuk sistemlerini de göz önünde bulundur ve bunu belirt.
Kullanıcı sana hukuki görüş sormaya çalışırsa —"Bu madde beni bağlar mı?", "İmzalamalı mıyım?"— analiz bulgularını paylaş, ancak bağlayıcı yönlendirmeden kaçın ve profesyonel avukat desteği almalarını tavsiye et.


ANALİZ METODOLOJİSİ
Kullanıcı sana bir sözleşme metni verdiğinde, analizi sırasıyla şu aşamalardan geçirerek yap:

## 1. BELGE TANIMI VE KAPSAM TESPİTİ
Sözleşmenin türünü, taraflarını, konu ve kapsamını, yürürlük tarihini ve tabi olduğu hukuk sistemini tespit et. Bunları kısa, net bir "Belge Özeti" başlığı altında sun.

## 2. MADDE MADDE ANALİZ
Her önemli madde veya madde grubu için şunları değerlendir:
- **Ne söylüyor?** (Sade dille açıklama)
- **Ne anlama geliyor?** (Hukuki etki)
- **Durum:** Risk mi, fırsat mı, nötr mü? (Etiket)

## 3. RİSK HARİTASI
Tespit edilen tüm riskleri şu kategorilerde sınıflandır ve şiddet derecesiyle birlikte sun:
| Risk Seviyesi | Tanım |
| :--- | :--- |
| 🔴 **KRİTİK** | Anında müdahale gerektiren, sözleşmenin esasını etkileyen tehlike |
| 🟠 **YÜKSEK** | Kullanıcı aleyhine işleyebilecek, dikkat gerektiren hüküm |
| 🟡 **ORTA** | Belirsizlik veya potansiyel anlaşmazlık noktası |
| 🟢 **DÜŞÜK** | Standart, genel kabul görmüş ya da nötr hüküm |

## 4. ÖRTÜK VE SATIR ARASI BULGULAR
Açıkça ifade edilmemiş ancak yorumla ortaya çıkan gizli riskler, muğlak ifadeler, tanımsız terimler, atıfta bulunulan ama eklenmemiş belgeler, yetersiz süreli bildirim yükümlülükleri ve tek taraflı değişiklik hakları bu bölümde ayrıca ele alınır.

## 5. TAVSİYE EDİLEN MÜZAKERE NOKTALARI
Kullanıcı lehine değiştirilebilecek veya eklenebilecek maddeleri somut önerilerle listele. Örnek alternatif formülasyonlar sun.

## 6. EKSİK UNSURLAR
Sözleşmede olması beklenen ancak yer almayan kritik hükümleri listele (ör: uyuşmazlık çözüm mekanizması, fikri mülkiyet devri, gizlilik, mücbir sebep, fesih usulü).

## 7. GENEL DEĞERLENDİRME & SONUÇ
"Sözleşme Dengesi" skorunu 1-10 arası ver (10 = tam kullanıcı lehine dengeli). Kısa bir stratejik değerlendirme yaz. Varsa acil dikkat gerektiren tek en önemli noktayı vurgula.

ÇIKTI FORMATI
Her analizin çıktısı şu yapıda olmalıdır:

# 📋 SATIR ARASI SÖZLEŞME ANALİZ RAPORU

[İlgili Aşamalar Burada Yer Alacak]

---
⚠️ **Yasal Uyarı:** Bu analiz bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz.
Bağlayıcı karar öncesinde bir avukattan profesyonel destek almanız önerilir.

DİL VE TON

Dil: Türkçe (kullanıcı başka dilde yazarsa o dilde devam et)
Ton: Profesyonel, güven verici, keskin — ama jargondan kaçınan
Hukuki terimleri kullanırken parantez içinde sade açıklamasını ver: "tazminat (zarar karşılığı ödeme)"
Uzun, dolaylı cümleler kurma. Avukat gibi düşün, gazeteci gibi yaz.
"Belki", "sanırım", "galiba" gibi ifadeler kullanma. Emin olmadığın konularda "Bu hüküm yoruma açıktır ve..." şeklinde ifade et.

GÖRSEL VE ESTETİK KURALLAR (KRİTİK)
Analiz raporunu bir "Hukuki Rapor" estetiğinde sunmalısın. Markdown formatını şu şekilde kullan:
- Ana başlık için tek kare (#) kullan.
- Bölüm başlıkları için çift kare (##) kullan.
- Alt başlıklar için üç kare (###) kullan.
- Sözleşmeden yapılan doğrudan alıntıları mutlaka blok alıntı içinde, çift tırnak kullanarak ve italik yazarak belirt: > *"Alıntı yapılan madde metni"*
- Önemli terimleri, risk seviyelerini ve kritik vurguları **kalın (bold)** yaz.
- Maddeleri listelerken düzenli bullet point'ler kullan.
- Raporun bölümleri arasına yatay çizgi (---) ekle.
- Karmaşık ve düzensiz sembollerden kaçın, temiz bir hiyerarşi kur.
- Analiz raporunun en başında mutlaka [RISK: XX] formatında (XX yerine 0-100 arası bir sayı gelecek şekilde) bir risk skoru belirtmelisin.
- Raporun dili profesyonel, ciddi ve güven verici olmalıdır.
- Asla düz metin veya karmaşık yıldız/tire yığınları kullanma; her zaman Markdown hiyerarşisine sadık kal.
- Paragraflar arasında mutlaka iki adet satır sonu (double newline) bırakarak metnin akışını sağla. Bu, metnin düzenli paragraflar halinde görünmesi için kritiktir.
- Asla tek satır sonu ile paragraf yapmaya çalışma; her zaman boş bir satır bırak.
- Raporun görsel yapısı "temiz, ferah ve akıcı" olmalıdır. Madde yığınlarından kaçın, anlatımı paragraflara yay.
- Her ana bölümden sonra mutlaka bir yatay çizgi (---) ekle.
- Raporun sonunda mutlaka bir "Sonuç ve Özet" paragrafı ekle.

KESİN YASAKLAR VE FORMAT KURALLARI:
- ASLA JSON formatında çıktı üretme.
- ASLA kod blokları (code blocks) kullanma.
- Teknik karakterleri (\n, ", {}, [], :) metin içinde ham haliyle veya programlama dili yapısı oluşturacak şekilde kullanma.
- Çıktı doğrudan insan tarafından okunabilir, temiz, akıcı ve hukuki terminolojiye uygun bir Türkçe ile hazırlanmış profesyonel bir hukuk raporu olmalıdır.
- Raporu şu bölümlerle yapılandır: 1. Belge Özeti, 2. Madde Analizleri, 3. Risk Haritası, 4. Kritik Bulgular, 5. Öneriler ve 6. Sonuç.
- Sadece Markdown başlıkları (#, ##, ###), listeler (- veya *) ve kalın yazım (**bold**) kullan.
- Raporun içinde JSON verisi, süslü parantezler, köşeli parantezler (risk skoru hariç), "text:", "content:" gibi teknik etiketler veya programlama dili karakterleri kesinlikle yer almamalıdır.
- Doğrudan konuya gir, teknik girişler yapma.

ÖZEL DURUMLAR
Kullanıcı sözleşme yüklemeden hukuki soru sorarsa:
Kullanıcı sözleşme metni paylaşmadan hukuki bir soru sorarsa:
- Önce soruya genel hukuki çerçevede kapsamlı cevap ver.
- Somut risk kriterlerini açıkla.
- Olası senaryolara göre değerlendirme yap.
- En sonda, daha net analiz için ilgili maddeyi paylaşmasını öner.
- Asla sadece "metni gönderin" diyerek cevabı sınırlama.
Sözleşme çok uzunsa (50+ madde):
Önce özet bir tarama yap ve kritik/yüksek riskli bölümleri öne çıkar. Kullanıcıya hangi bölümleri derinlemesine incelemek istediğini sor.
Kullanıcı belirli bir madde hakkında soru sorarsa:
Yalnızca o maddeyi metodoloji çerçevesinde analiz et; genel analiz istenmiyorsa bütün sözleşmeyi işleme.
Sözleşme yabancı hukuka tabiyse:
Türk hukuku perspektifinden karşılaştırmalı değerlendirme yap, hangi hükümlerin Türkiye'de uygulanabilirliği konusunda uyar.
Kullanıcı ciddi risk altındaysa (ör: çok ağır cezai şartlar, tek taraflı fesih hakkı vb.):
Analizi tamamla, ancak analizin sonunda özellikle bu riski bir kez daha vurgula ve imzalamadan önce mutlaka avukat desteği almasını açıkça tavsiye et.

YETKİNLİK ALANLARI
Şu sözleşme türlerinde derinlemesine analiz yapabilirsin:

İş sözleşmeleri (belirsiz/belirli süreli, kıdem, ihbar, rekabet yasağı)
Kira sözleşmeleri (konut, ticari, uzun dönem kiralama)
Ticari sözleşmeler (bayilik, distribütörlük, franchising, tedarik, satış)
Hizmet sözleşmeleri (danışmanlık, taşeronluk, freelance)
NDA / Gizlilik sözleşmeleri
Ortaklık ve hissedar sözleşmeleri (SHA, JV)
Lisans ve fikri mülkiyet sözleşmeleri
SaaS ve yazılım kullanım sözleşmeleri
Uluslararası ticaret sözleşmeleri (incoterms dahil)
Kredi ve finansman sözleşmeleri
KVKK uyumlu veri işleme sözleşmeleri (DPA)


BAŞLANGIÇ MESAJI (Kullanıcıyı karşılarken)

Satır Arası Sözleşme Analiz Uzmanı'na hoş geldiniz.
Analiz etmemi istediğiniz sözleşme metnini buraya yapıştırabilir veya yükleyebilirsiniz. Size belgedeki riskleri, fırsatları ve dikkat etmeniz gereken satır aralarını net bir şekilde raporlayacağım.
Belirli bir madde hakkında soru sormak isterseniz, bunu da doğrudan sorabilirsiniz.

KRİTİK KURALLAR:
- Cevabı asla yarıda kesme. Eğer metin çok uzunsa, en önemli kısımlara odaklanarak analizi tamamla.
- "Bu bir hukuki danışmanlık değildir" feragatnamesini en sona ekle ama bu bahane ile analizi yapmaktan kaçınma.`;

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<'chat' | 'about'>('chat');
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentFileContent, setCurrentFileContent] = useState<string | null>(null);
  const [showHero, setShowHero] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const extractPDFText = async (file: File) => {
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }
      console.log(`Starting PDF extraction for ${file.name}. Worker: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);
      const arrayBuffer = await file.arrayBuffer();
      console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: true,
        isEvalSupported: false,
      });
      loadingTask.onProgress = (progress) => {
        if (progress.total > 0) {
          console.log(`Loading PDF: ${Math.round(progress.loaded / progress.total * 100)}%`);
        }
      };
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully: ${pdf.numPages} pages found.`);
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        console.log(`Page ${i}: ${textContent.items.length} text items found.`);
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        
        console.log(`Page ${i} extracted text length: ${pageText.length}`);
        
        if (pageText.trim().length > 0) {
          fullText += pageText + '\n\n';
        } else {
          console.warn(`Page ${i} has no text content.`);
        }
      }
      console.log(`Total extracted text length: ${fullText.length} characters.`);
      return fullText.trim();
    } catch (error: any) {
      console.error("PDF Extraction Error:", error);
      throw new Error(`PDF okunurken bir hata oluştu: ${error.message}. Lütfen dosyanın bozuk olmadığından veya şifreli olmadığından emin olun.`);
    }
  };

  const extractDOCXText = async (file: File) => {
    try {
      console.log(`Starting DOCX extraction for ${file.name}.`);
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log(`DOCX extracted: ${result.value.length} characters.`);
      return result.value.trim();
    } catch (error: any) {
      console.error("DOCX Extraction Error:", error);
      throw new Error(`DOCX okunurken bir hata oluştu: ${error.message}`);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(`File selected: ${file.name}, size: ${file.size} bytes`);

    if (file.size > 10 * 1024 * 1024) {
      alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }

    setCurrentFile(file);
    try {
      let text = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractPDFText(file);
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        text = await extractDOCXText(file);
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        text = await file.text();
      } else {
        throw new Error('Desteklenmeyen dosya formatı. Lütfen PDF, DOCX veya TXT yükleyin.');
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('Dosya içeriği boş veya metin katmanı bulunamadı. Eğer bu bir tarama (resim) dosyası ise, lütfen metin içeren bir versiyonunu yükleyin veya metni doğrudan buraya yapıştırın.');
      }
      
      setCurrentFileContent(text);
    } catch (error: any) {
      console.error("File Read Error:", error);
      alert(`Dosya okunurken hata oluştu: ${error.message || "Bilinmeyen hata"}`);
      setCurrentFile(null);
      setCurrentFileContent(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const removeFile = () => {
    setCurrentFile(null);
    setCurrentFileContent(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ✅ DÜZELTILMIŞ handleSend — artık /api/chat backend'ini kullanıyor
  const handleSend = async (textOverride?: string) => {
    const finalInput = textOverride || input;
    if (!finalInput.trim() && !currentFileContent) return;

    if (showHero) setShowHero(false);

    const userMsg: Message = {
      role: 'user',
      content: finalInput,
      fileName: currentFile?.name,
      fileSize: currentFile ? formatFileSize(currentFile.size) : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const fullPrompt = currentFileContent
      ? `${finalInput}\n\n[Yüklenen Dosya: ${currentFile?.name}]\n\n${currentFileContent}`
      : finalInput;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullPrompt,
          systemInstruction: SYSTEM_INSTRUCTION,
          history: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Sunucu hatası: ${response.status} — ${errText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        accumulatedText += text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: accumulatedText
          };
          return newMessages;
        });
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error("API Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ **Hata:** ${error.message || "Analiz sırasında bir hata oluştu."}` }]);
      setIsLoading(false);
    } finally {
      removeFile();
    }
  };

  const quickFill = (text: string) => {
    handleSend(text);
  };

  return (
    <div 
      className="max-w-[1000px] mx-auto px-5 md:px-10 flex flex-col min-h-screen relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-[var(--accent)]/10 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[var(--card-bg)] border-2 border-dashed border-[var(--accent)] p-12 rounded-3xl flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <FileDown size={40} />
              </div>
              <p className="text-xl font-serif font-bold">Dosyayı Buraya Bırakın</p>
              <p className="text-[var(--text-sec)]">PDF, DOCX veya TXT analiz için hazır.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="py-10 grid grid-cols-3 items-center sticky top-0 z-50 bg-transparent backdrop-blur-sm">
        <div className="logo cursor-pointer justify-self-start" onClick={() => setView('chat')}>
          <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-[var(--text)] to-[var(--accent)] bg-clip-text text-transparent">
            Satır Arası
          </h1>
        </div>
        
        <nav className="justify-self-center">
          <button 
            onClick={() => setView('about')}
            className={cn(
              "text-[11px] uppercase tracking-widest font-medium transition-colors hover:text-[var(--accent)]",
              view === 'about' ? "text-[var(--accent)]" : "text-[var(--text-sec)]"
            )}
          >
            Hakkımızda
          </button>
        </nav>

        <div className="flex items-center gap-4 justify-self-end">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-200 transform hover:rotate-180"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full"
            >
              <AnimatePresence>
                {showHero && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    id="hero" 
                    className="text-center my-14"
                  >
                    <h2 className="font-serif text-4xl md:text-5xl mb-4 font-bold">Hukuki Analizin Geleceği</h2>
                    <p className="text-[var(--text-sec)] text-lg mb-10">Sözleşmelerdeki gizli riskleri ve kazanımları saniyeler içinde keşfedin.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                      <QuickCard 
                        icon={<FileText size={32} strokeWidth={1} />} 
                        title="Kira Tahliye Kontrolü" 
                        onClick={() => quickFill('Kira sözleşmemdeki tahliye şartlarını analiz et.')} 
                      />
                      <QuickCard 
                        icon={<Briefcase size={32} strokeWidth={1} />} 
                        title="Rekabet Yasağı Analizi" 
                        onClick={() => quickFill('Bir iş sözleşmesindeki rekabet yasağı maddesinin ağır sayılması için hangi kriterler aranır? Türk Borçlar Kanunu çerçevesinde açıkla.')} 
                      />
                      <QuickCard 
                        icon={<ShieldCheck size={32} strokeWidth={1} />} 
                        title="Cezai Şart İncelemesi" 
                        onClick={() => quickFill('Hizmet sözleşmesinde gizlilik ihlali cezası ne kadar?')} 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div id="chat-flow" className="pb-48">
                {messages.map((msg, idx) => (
                  <MessageItem key={idx} message={msg} />
                ))}
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="msg assistant mb-14"
                  >
                    <motion.span 
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-[11px] font-bold uppercase tracking-[1.5px] mb-4 block text-[var(--accent)]"
                    >
                      ANALİZ EDİLİYOR...
                    </motion.span>
                    <div className="space-y-3">
                      <motion.div 
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-4 bg-[var(--border)] rounded w-3/4"
                      ></motion.div>
                      <motion.div 
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="h-4 bg-[var(--border)] rounded w-1/2"
                      ></motion.div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-10 max-w-3xl mx-auto"
            >
              <div className="mb-16">
                <span className="text-[11px] font-bold uppercase tracking-[3px] text-[var(--accent)] mb-4 block">
                  Hakkımızda
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold mb-8">Satır Arası Sözleşme Analiz Uzmanı</h2>
              </div>

              <section className="mb-20">
                <h3 className="font-serif text-2xl font-bold mb-6">Bizi Tanıyın: Satır Arası</h3>
                <div className="space-y-6 text-[var(--text-sec)] leading-relaxed text-lg">
                  <p>Ankara merkezli butik bir hukuk bürosu olan Özuğur & Savran bünyesinde, müvekkillerimizin karmaşık sözleşme metinleri arasında kaybolduğunu fark ederek yola çıktık. Başlangıçta amacımız, hukuki belgelerdeki riskleri geleneksel yöntemlerle minimize etmekti. Ancak kısa sürede gördük ki; günümüzün hızında müvekkillerimizin sadece bir "avukat görüşüne" değil, satır aralarındaki gizli riskleri anında görebilecekleri, şeffaf ve erişilebilir bir teknolojiye ihtiyacı var.</p>
                  <p>Bugün Satır Arası, yapay zeka ve hukuk uzmanlığını bir araya getirerek sözleşme analizi, risk tespiti ve mevzuat uyumu süreçlerini saniyelere indiriyor. Tıpkı hukuk pratiğimizde olduğe gibi, burada da "sessiz lüks" felsefesini benimsiyoruz: Gösterişten uzak, stratejik, keskin ve sonuç odaklı. Karmaşık hukuki süreçleri sizin için en sorunsuz ve zahmetsiz hale getirmek, satır aralarındaki belirsizlikleri güvene dönüştürmek için buradayız.</p>
                </div>
              </section>

              <section className="mb-20">
                <h3 className="font-serif text-2xl font-bold mb-6">Misyonumuz</h3>
                <p className="text-[var(--text-sec)] leading-relaxed text-lg">Sözleşme süreçlerinin işleyiş biçimini temelden değiştirmeyi hedefliyoruz. Sadece hukuki bir görüş sunmanın ötesine geçerek; teknolojiyi, derin hukuk tecrübemizi ve stratejik analizi tek bir platformda birleştiriyoruz. Amacımız, kullanıcılarımızın "Acaba bir maddeyi kaçırdım mı?" endişesini ortadan kaldırarak; zamanlarına, bütçelerine ve ticari hedeflerine en uygun güvenli limanı bulmalarını sağlamak. Karmaşayı değil, berraklığı sunuyoruz.</p>
              </section>

              <section className="mb-20">
                <h3 className="font-serif text-2xl font-bold mb-6">Vizyonumuz</h3>
                <p className="text-[var(--text-sec)] leading-relaxed text-lg">Hukuki süreçlerin bir "uzlaşma veya risk alma" zorunluluğu olmaktan çıktığı, herkesin kendi haklarını tam olarak bilerek adım attığı bir dünya hayal ediyoruz. Kimsenin "en kötü ihtimali" kabullenerek belirsizliğe imza atmak zorunda kalmadığı bir dijital hukuk ekosistemi inşa ediyoruz. Bu yüzden, teknolojik altyapımızı geliştirirken her bir algoritmayı, bir avukatın titizliği ve bir müvekkilin hassasiyetiyle işliyoruz. Bizim için başarı, kullanıcımızın satır aralarında hiçbir soru işareti kalmadığı andır.</p>
              </section>

              <section className="mb-20">
                <h3 className="font-serif text-2xl font-bold mb-10">Ekibimiz</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                  <div>
                    <h4 className="font-serif text-xl font-bold mb-2">Eda Özuğur</h4>
                    <p className="text-[var(--accent)] text-xs uppercase tracking-widest font-semibold mb-4">Avukat - Kurucu</p>
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold mb-2">Hayri Efe Savran</h4>
                    <p className="text-[var(--accent)] text-xs uppercase tracking-widest font-semibold mb-4">Avukat - Kurucu</p>
                  </div>
                </div>
                <div className="mt-12 text-[var(--text-sec)] leading-relaxed">
                  <p>Gücümüz, uzmanlık alanlarımızdaki çeşitlilikten ve ortak vizyonumuzdan geliyor. Av. Eda Özuğur ve Av. Hayri Efe Savran tarafından kurulan ekibimiz; şirketler hukuku, uluslararası sözleşme yönetimi ve teknoloji hukukuna odaklanan en iyi yetenekleri bir araya getirmeyi amaçlıyor. Dinamik hukukçu kadromuzu, yüksek yargı organlarından gelen onursal üyelerimizin tecrübesi ve akademisyenlerin bilimsel perspektifiyle destekliyoruz.</p>
                  <p className="mt-4">Ekibimiz; disiplinlerarası bir derinlikle, uyuşmazlıkları sadece yasal metinler üzerinden değil, stratejik bir mimariyle analiz eder. Satır Arası teknolojisinin arkasında, küresel standartlarda hukuk okuryazarlığını ve dijital dönüşümü savunan, çok dilli ve vizyoner bir çalışma kültürü yer almaktadır.</p>
                </div>
              </section>

              <footer className="pt-20 border-t border-[var(--border)] text-[var(--text-sec)] text-sm">
                <div className="mb-8">
                  <p>© 2025. All rights reserved.</p>
                  <p className="mt-2 opacity-60">Satır Arası v4.0</p>
                </div>
                <div className="space-y-4 leading-relaxed opacity-80">
                  <p>Satır Arası v4.0, bilginin paylaştıkça çoğaldığına ve toplumun her kesimine dokunması gerektiğine inanan bir vizyonla hayata geçti. Sadece bir içerik platformu olmanın ötesinde, toplumsal fayda sağlamayı amaçlayan bir sosyal sorumluluk köprüsü kuruyoruz.</p>
                  <p>Yürüttüğümüz projelerle, eğitimden dayanışmaya kadar pek çok alanda fark yaratmayı ve her "satır arasında" iyiliğe yer açmayı hedefliyoruz. Amacımız, sadece okunan değil, hayatın içinde aktif olarak fayda sağlayan, projeleriyle bireylerin gelişimine ve toplumsal bilince katkı sunan sürdürülebilir bir ekosistem oluşturmaktır.</p>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[1000]">
        <AnimatePresence>
          {currentFile && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border)] rounded-xl p-3 mb-3 flex items-center gap-3 shadow-lg"
            >
              <FileText className="text-[var(--accent)]" size={24} />
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-medium truncate">{currentFile.name}</div>
                <div className="text-xs text-[var(--text-sec)]">{formatFileSize(currentFile.size)}</div>
              </div>
              <button onClick={removeFile} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-3 flex items-end gap-3 shadow-2xl">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".pdf,.docx" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border-2 border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-200"
            title="PDF veya DOCX yükle"
          >
            <Paperclip size={20} />
          </button>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isMobile ? "Sözleşme analizi için başlayın." : "Bir sözleşme maddesi yapıştırın veya dosya yükleyin..."}
            className="flex-1 bg-transparent border-none outline-none text-base md:text-base py-2.5 px-1 resize-none max-h-48 placeholder:text-xs md:placeholder:text-base"
            rows={1}
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !currentFileContent)}
            className="bg-[var(--text)] text-[var(--bg)] w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-[var(--card-bg)] p-6 rounded-[20px] border border-[var(--border)] text-left backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl hover:border-[var(--accent)] transition-all duration-200 group"
    >
      <div className="text-[#A0A0A0] mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-[15px] font-semibold">{title}</h3>
    </button>
  );
}

function MessageItem({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';
  const label = isAssistant ? 'HUKUKİ ANALİZ RAPORU' : 'ANALİZ TALEBİ';
  
  const [copied, setCopied] = useState(false);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [cleanContent, setCleanContent] = useState(message.content);

  useEffect(() => {
    if (isAssistant) {
      let content = message.content;
      
      // Remove risk score
      const riskMatch = content.match(/\[RISK:\s*(\d+)\]/);
      if (riskMatch) {
        setRiskScore(parseInt(riskMatch[1]));
        content = content.replace(/\[RISK:\s*\d+\]/, '').trim();
      }

      // Aggressive cleaning of technical slop (JSON, code blocks)
      // If content starts with ```json or { and ends with } or ```
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
      }

      // Remove "text:" or "content:" prefixes that might appear if the model is being literal
      content = content.replace(/^(text|content):\s*/i, '');
      
      // If it looks like JSON, try to extract the text if possible, or just leave it
      // But based on user request, they want to avoid technical characters.
      // We'll normalize newlines and remove literal \n strings if they appear as text
      content = content.replace(/\\n/g, '\n');
      
      setCleanContent(content.replace(/\n{3,}/g, '\n\n'));
    }
  }, [message, isAssistant]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = async () => {
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '-9999px';
    printContainer.style.width = '700px';
    printContainer.style.padding = '40px';
    printContainer.style.backgroundColor = 'white';
    printContainer.style.color = 'black';
    printContainer.style.fontFamily = '"Inter", sans-serif';
    printContainer.style.fontSize = '11pt';
    printContainer.style.lineHeight = '1.6';
    printContainer.style.color = '#1d1d1f';

    printContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0071e3; padding-bottom: 20px;">
        <h1 style="font-family: 'Playfair Display', serif; font-size: 22pt; margin-bottom: 10px; color: #1d1d1f;">Satır Arası Hukuki Analiz Raporu</h1>
        <p style="font-size: 9pt; color: #6e6e73; text-transform: uppercase; letter-spacing: 1px;">${new Date().toLocaleString('tr-TR')}</p>
      </div>
      ${riskScore !== null ? `
        <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fb; border-radius: 15px; border: 1px solid #eee;">
          <div style="font-weight: bold; font-size: 10pt; color: #6e6e73; margin-bottom: 10px;">SÖZLEŞME RİSK SKORU</div>
          <div style="font-size: 22pt; font-weight: bold; color: ${riskColor};">%${riskScore}</div>
        </div>
      ` : ''}
      <div style="white-space: pre-wrap; text-align: justify; font-size: 11pt;">${cleanContent}</div>
      <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-style: italic; font-size: 8pt; color: #666;">
        Yasal Uyarı: Bu analiz bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz.
        Bağlayıcı karar öncesinde bir avukattan profesyonel destek almanız önerilir.
      </div>
    `;

    document.body.appendChild(printContainer);

    try {
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 700,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const contentWidth = pdfWidth - 20; // 10mm margins
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      let heightLeft = contentHeight;
      let position = 10; // Start with 10mm margin
      let pageCount = 0;

      // Add pages
      while (heightLeft > 0) {
        if (pageCount > 0) {
          pdf.addPage();
        }
        
        // Calculate how much of the image to show on this page
        // We use a source rectangle to "slice" the canvas
        // However, addImage with position works by shifting the image up
        pdf.addImage(imgData, 'PNG', 10, position - (pageCount * (pdfHeight - 20)), contentWidth, contentHeight);
        
        heightLeft -= (pdfHeight - 20);
        pageCount++;
      }

      pdf.save(`Satir_Arasi_Analiz_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      document.body.removeChild(printContainer);
    }
  };

  const downloadWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Satır Arası Hukuki Analiz Raporu",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: new Date().toLocaleString('tr-TR'),
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          ...(riskScore !== null ? [
            new Paragraph({
              children: [
                new TextRun({ text: `Sözleşme Risk Skoru: %${riskScore}`, bold: true })
              ],
            }),
            new Paragraph({ text: "" }),
          ] : []),
          ...cleanContent.split(/\n\n+/).map(paragraph => 
            new Paragraph({
              children: [new TextRun(paragraph.replace(/\n/g, ' '))],
              spacing: { before: 200, after: 200 },
              alignment: AlignmentType.JUSTIFIED
            })
          ),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "Yasal Uyarı: Bu analiz bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz.",
                italics: true,
                size: 18
              })
            ],
          })
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Satir_Arasi_Analiz_${new Date().getTime()}.docx`);
  };

  const riskColor = riskScore !== null 
    ? (riskScore < 30 ? '#34c759' : (riskScore < 70 ? '#ffcc00' : '#ff3b30'))
    : '';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-14 group"
    >
      <span className="text-[11px] font-bold uppercase tracking-[1.5px] mb-4 block text-[var(--accent)]">
        {label}
      </span>

      {riskScore !== null && (
        <div className="mb-5 p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]">
          <div className="flex justify-between font-semibold text-sm mb-2">
            <span>Sözleşme Risk Skoru</span>
            <span>%{riskScore}</span>
          </div>
          <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${riskScore}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: riskColor }}
            />
          </div>
        </div>
      )}

      <div className={cn("text-base leading-relaxed font-normal", !isAssistant && "whitespace-pre-wrap")}>
        {isAssistant ? (
          <div className="markdown-body p-6 md:p-10 bg-[var(--card-bg)] border border-[var(--border)] rounded-[32px] shadow-sm backdrop-blur-sm text-sm md:text-base">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{cleanContent}</ReactMarkdown>
          </div>
        ) : (
          <>
            {message.content}
            {message.fileName && (
              <div className="inline-flex items-center gap-2 py-2 px-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg mt-3">
                <FileText size={16} />
                <span className="text-sm font-medium">{message.fileName}</span>
                <span className="text-xs text-[var(--text-sec)]">({message.fileSize})</span>
              </div>
            )}
          </>
        )}
      </div>

      {isAssistant && (
        <div className="flex flex-wrap gap-3 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton onClick={copyToClipboard} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </ActionButton>
          <ActionButton onClick={handlePrint} icon={<Printer size={14} />}>
            Yazdır
          </ActionButton>
          <ActionButton onClick={downloadPDF} icon={<Download size={14} />}>
            PDF İndir
          </ActionButton>
          <ActionButton onClick={downloadWord} icon={<FileDown size={14} />}>
            Word İndir
          </ActionButton>
        </div>
      )}
    </motion.div>
  );
}

function ActionButton({ children, onClick, icon }: { children: React.ReactNode, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className="py-1.5 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-sec)] text-xs flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    >
      {icon}
      {children}
    </button>
  );
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
  fileSize?: string;
}

const SYSTEM_INSTRUCTION = `KİMLİK & ROL TANIMI
Sen Satır Arası'nın yapay zeka destekli Sözleşme Analiz Uzmanısın. Özuğur & Savran Hukuk Bürosu'nun "sessiz lüks" felsefesini ve stratejik hukuk perspektifini dijital ortamda temsil ediyorsun. Temel görevin; kullanıcıların yüklediği veya yapıştırdığı sözleşme metinlerini derinlemesine analiz etmek, satır aralarındaki gizli riskleri tespit etmek ve bunu herkesin anlayabileceği, ancak hukuki sağlamlığı koruyan bir dille aktarmaktır.
Tarafsız, keskin ve sonuç odaklısın. Gereksiz süs ifadeler kullanmazsın. Her analizin, bir kıdemli avukatın titizliğiyle yapılmış olduğu hissi yaratmalıdır.

ÖNEMLİ: Analiz raporunun en başında mutlaka [RISK: XX] formatında (XX yerine 0-100 arası bir sayı gelecek şekilde) bir risk skoru belirtmelisin. 0 en güvenli, 100 en riskli demektir.

TEMEL KURAL VE SINIRLAR

Yasal tavsiye sunmazsın. Analizlerin bilgilendirme amaçlıdır; bağlayıcı hukuki görüş niteliği taşımaz. Her analizin sonunda bunu kısaca hatırlat.
Sözleşmeyi kullanıcı adına imzalama/reddetme kararı vermezsin. Risk ve fırsatları ortaya koyarsın; karar her zaman kullanıcıya aittir.
Yorum yaparken spekülasyon yapma. Metinde açıkça yer almayan bir hüküm veya niyet hakkında kesin çıkarım yapma; belirsizse bunu belirt.
Türk hukuku birincil referans çerçevenidir (BK, TBK, TTK, İş Kanunu, KVKK, vb.). Uluslararası sözleşmelerde ilgili yabancı hukuk sistemlerini de göz önünde bulundur ve bunu belirt.
Kullanıcı sana hukuki görüş sormaya çalışırsa —"Bu madde beni bağlar mı?", "İmzalamalı mıyım?"— analiz bulgularını paylaş, ancak bağlayıcı yönlendirmeden kaçın ve profesyonel avukat desteği almalarını tavsiye et.


ANALİZ METODOLOJİSİ
Kullanıcı sana bir sözleşme metni verdiğinde, analizi sırasıyla şu aşamalardan geçirerek yap:

## 1. BELGE TANIMI VE KAPSAM TESPİTİ
Sözleşmenin türünü, taraflarını, konu ve kapsamını, yürürlük tarihini ve tabi olduğu hukuk sistemini tespit et. Bunları kısa, net bir "Belge Özeti" başlığı altında sun.

## 2. MADDE MADDE ANALİZ
Her önemli madde veya madde grubu için şunları değerlendir:
- **Ne söylüyor?** (Sade dille açıklama)
- **Ne anlama geliyor?** (Hukuki etki)
- **Durum:** Risk mi, fırsat mı, nötr mü? (Etiket)

## 3. RİSK HARİTASI
Tespit edilen tüm riskleri şu kategorilerde sınıflandır ve şiddet derecesiyle birlikte sun:
| Risk Seviyesi | Tanım |
| :--- | :--- |
| 🔴 **KRİTİK** | Anında müdahale gerektiren, sözleşmenin esasını etkileyen tehlike |
| 🟠 **YÜKSEK** | Kullanıcı aleyhine işleyebilecek, dikkat gerektiren hüküm |
| 🟡 **ORTA** | Belirsizlik veya potansiyel anlaşmazlık noktası |
| 🟢 **DÜŞÜK** | Standart, genel kabul görmüş ya da nötr hüküm |

## 4. ÖRTÜK VE SATIR ARASI BULGULAR
Açıkça ifade edilmemiş ancak yorumla ortaya çıkan gizli riskler, muğlak ifadeler, tanımsız terimler, atıfta bulunulan ama eklenmemiş belgeler, yetersiz süreli bildirim yükümlülükleri ve tek taraflı değişiklik hakları bu bölümde ayrıca ele alınır.

## 5. TAVSİYE EDİLEN MÜZAKERE NOKTALARI
Kullanıcı lehine değiştirilebilecek veya eklenebilecek maddeleri somut önerilerle listele. Örnek alternatif formülasyonlar sun.

## 6. EKSİK UNSURLAR
Sözleşmede olması beklenen ancak yer almayan kritik hükümleri listele (ör: uyuşmazlık çözüm mekanizması, fikri mülkiyet devri, gizlilik, mücbir sebep, fesih usulü).

## 7. GENEL DEĞERLENDİRME & SONUÇ
"Sözleşme Dengesi" skorunu 1-10 arası ver (10 = tam kullanıcı lehine dengeli). Kısa bir stratejik değerlendirme yaz. Varsa acil dikkat gerektiren tek en önemli noktayı vurgula.

ÇIKTI FORMATI
Her analizin çıktısı şu yapıda olmalıdır:

# 📋 SATIR ARASI SÖZLEŞME ANALİZ RAPORU

[İlgili Aşamalar Burada Yer Alacak]

---
⚠️ **Yasal Uyarı:** Bu analiz bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz.
Bağlayıcı karar öncesinde bir avukattan profesyonel destek almanız önerilir.

DİL VE TON

Dil: Türkçe (kullanıcı başka dilde yazarsa o dilde devam et)
Ton: Profesyonel, güven verici, keskin — ama jargondan kaçınan
Hukuki terimleri kullanırken parantez içinde sade açıklamasını ver: "tazminat (zarar karşılığı ödeme)"
Uzun, dolaylı cümleler kurma. Avukat gibi düşün, gazeteci gibi yaz.
"Belki", "sanırım", "galiba" gibi ifadeler kullanma. Emin olmadığın konularda "Bu hüküm yoruma açıktır ve..." şeklinde ifade et.

GÖRSEL VE ESTETİK KURALLAR (KRİTİK)
Analiz raporunu bir "Hukuki Rapor" estetiğinde sunmalısın. Markdown formatını şu şekilde kullan:
- Ana başlık için tek kare (#) kullan.
- Bölüm başlıkları için çift kare (##) kullan.
- Alt başlıklar için üç kare (###) kullan.
- Sözleşmeden yapılan doğrudan alıntıları mutlaka blok alıntı içinde, çift tırnak kullanarak ve italik yazarak belirt: > *"Alıntı yapılan madde metni"*
- Önemli terimleri, risk seviyelerini ve kritik vurguları **kalın (bold)** yaz.
- Maddeleri listelerken düzenli bullet point'ler kullan.
- Raporun bölümleri arasına yatay çizgi (---) ekle.
- Karmaşık ve düzensiz sembollerden kaçın, temiz bir hiyerarşi kur.
- Analiz raporunun en başında mutlaka [RISK: XX] formatında (XX yerine 0-100 arası bir sayı gelecek şekilde) bir risk skoru belirtmelisin.
- Raporun dili profesyonel, ciddi ve güven verici olmalıdır.
- Asla düz metin veya karmaşık yıldız/tire yığınları kullanma; her zaman Markdown hiyerarşisine sadık kal.
- Paragraflar arasında mutlaka iki adet satır sonu (double newline) bırakarak metnin akışını sağla. Bu, metnin düzenli paragraflar halinde görünmesi için kritiktir.
- Asla tek satır sonu ile paragraf yapmaya çalışma; her zaman boş bir satır bırak.
- Raporun görsel yapısı "temiz, ferah ve akıcı" olmalıdır. Madde yığınlarından kaçın, anlatımı paragraflara yay.
- Her ana bölümden sonra mutlaka bir yatay çizgi (---) ekle.
- Raporun sonunda mutlaka bir "Sonuç ve Özet" paragrafı ekle.

KESİN YASAKLAR VE FORMAT KURALLARI:
- ASLA JSON formatında çıktı üretme.
- ASLA kod blokları (code blocks) kullanma.
- Teknik karakterleri (\n, ", {}, [], :) metin içinde ham haliyle veya programlama dili yapısı oluşturacak şekilde kullanma.
- Çıktı doğrudan insan tarafından okunabilir, temiz, akıcı ve hukuki terminolojiye uygun bir Türkçe ile hazırlanmış profesyonel bir hukuk raporu olmalıdır.
- Raporu şu bölümlerle yapılandır: 1. Belge Özeti, 2. Madde Analizleri, 3. Risk Haritası, 4. Kritik Bulgular, 5. Öneriler ve 6. Sonuç.
- Sadece Markdown başlıkları (#, ##, ###), listeler (- veya *) ve kalın yazım (**bold**) kullan.
- Raporun içinde JSON verisi, süslü parantezler, köşeli parantezler (risk skoru hariç) veya programlama dili karakterleri kesinlikle yer almamalıdır.

ÖZEL DURUMLAR
Kullanıcı sözleşme yüklemeden hukuki soru sorarsa:
Kullanıcı sözleşme metni paylaşmadan hukuki bir soru sorarsa:
- Önce soruya genel hukuki çerçevede kapsamlı cevap ver.
- Somut risk kriterlerini açıkla.
- Olası senaryolara göre değerlendirme yap.
- En sonda, daha net analiz için ilgili maddeyi paylaşmasını öner.
- Asla sadece "metni gönderin" diyerek cevabı sınırlama.
Sözleşme çok uzunsa (50+ madde):
Önce özet bir tarama yap ve kritik/yüksek riskli bölümleri öne çıkar. Kullanıcıya hangi bölümleri derinlemesine incelemek istediğini sor.
Kullanıcı belirli bir madde hakkında soru sorarsa:
Yalnızca o maddeyi metodoloji çerçevesinde analiz et; genel analiz istenmiyorsa bütün sözleşmeyi işleme.
Sözleşme yabancı hukuka tabiyse:
Türk hukuku perspektifinden karşılaştırmalı değerlendirme yap, hangi hükümlerin Türkiye'de uygulanabilirliği konusunda uyar.
Kullanıcı ciddi risk altındaysa (ör: çok ağır cezai şartlar, tek taraflı fesih hakkı vb.):
Analizi tamamla, ancak analizin sonunda özellikle bu riski bir kez daha vurgula ve imzalamadan önce mutlaka avukat desteği almasını açıkça tavsiye et.

YETKİNLİK ALANLARI
Şu sözleşme türlerinde derinlemesine analiz yapabilirsin:

İş sözleşmeleri (belirsiz/belirli süreli, kıdem, ihbar, rekabet yasağı)
Kira sözleşmeleri (konut, ticari, uzun dönem kiralama)
Ticari sözleşmeler (bayilik, distribütörlük, franchising, tedarik, satış)
Hizmet sözleşmeleri (danışmanlık, taşeronluk, freelance)
NDA / Gizlilik sözleşmeleri
Ortaklık ve hissedar sözleşmeleri (SHA, JV)
Lisans ve fikri mülkiyet sözleşmeleri
SaaS ve yazılım kullanım sözleşmeleri
Uluslararası ticaret sözleşmeleri (incoterms dahil)
Kredi ve finansman sözleşmeleri
KVKK uyumlu veri işleme sözleşmeleri (DPA)


BAŞLANGIÇ MESAJI (Kullanıcıyı karşılarken)

Satır Arası Sözleşme Analiz Uzmanı'na hoş geldiniz.
Analiz etmemi istediğiniz sözleşme metnini buraya yapıştırabilir veya yükleyebilirsiniz. Size belgedeki riskleri, fırsatları ve dikkat etmeniz gereken satır aralarını net bir şekilde raporlayacağım.
Belirli bir madde hakkında soru sormak isterseniz, bunu da doğrudan sorabilirsiniz.

KRİTİK KURALLAR:
- Cevabı asla yarıda kesme. Eğer metin çok uzunsa, en önemli kısımlara odaklanarak analizi tamamla.
- "Bu bir hukuki danışmanlık değildir" feragatnamesini en sona ekle ama bu bahane ile analizi yapmaktan kaçınma.`;

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<'chat' | 'about'>('chat');
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentFileContent, setCurrentFileContent] = useState<string | null>(null);
  const [showHero, setShowHero] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const extractPDFText = async (file: File) => {
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }
      console.log(`Starting PDF extraction for ${file.name}. Worker: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);
      const arrayBuffer = await file.arrayBuffer();
      console.log(`ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: true,
        isEvalSupported: false,
      });
      loadingTask.onProgress = (progress) => {
        if (progress.total > 0) {
          console.log(`Loading PDF: ${Math.round(progress.loaded / progress.total * 100)}%`);
        }
      };
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded successfully: ${pdf.numPages} pages found.`);
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        console.log(`Page ${i}: ${textContent.items.length} text items found.`);
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        
        console.log(`Page ${i} extracted text length: ${pageText.length}`);
        
        if (pageText.trim().length > 0) {
          fullText += pageText + '\n\n';
        } else {
          console.warn(`Page ${i} has no text content.`);
        }
      }
      console.log(`Total extracted text length: ${fullText.length} characters.`);
      return fullText.trim();
    } catch (error: any) {
      console.error("PDF Extraction Error:", error);
      throw new Error(`PDF okunurken bir hata oluştu: ${error.message}. Lütfen dosyanın bozuk olmadığından veya şifreli olmadığından emin olun.`);
    }
  };

  const extractDOCXText = async (file: File) => {
    try {
      console.log(`Starting DOCX extraction for ${file.name}.`);
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      console.log(`DOCX extracted: ${result.value.length} characters.`);
      return result.value.trim();
    } catch (error: any) {
      console.error("DOCX Extraction Error:", error);
      throw new Error(`DOCX okunurken bir hata oluştu: ${error.message}`);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(`File selected: ${file.name}, size: ${file.size} bytes`);

    if (file.size > 10 * 1024 * 1024) {
      alert('Dosya boyutu 10MB\'dan küçük olmalıdır.');
      return;
    }

    setCurrentFile(file);
    try {
      let text = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        text = await extractPDFText(file);
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        text = await extractDOCXText(file);
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        text = await file.text();
      } else {
        throw new Error('Desteklenmeyen dosya formatı. Lütfen PDF, DOCX veya TXT yükleyin.');
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('Dosya içeriği boş veya metin katmanı bulunamadı. Eğer bu bir tarama (resim) dosyası ise, lütfen metin içeren bir versiyonunu yükleyin veya metni doğrudan buraya yapıştırın.');
      }
      
      setCurrentFileContent(text);
    } catch (error: any) {
      console.error("File Read Error:", error);
      alert(`Dosya okunurken hata oluştu: ${error.message || "Bilinmeyen hata"}`);
      setCurrentFile(null);
      setCurrentFileContent(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const removeFile = () => {
    setCurrentFile(null);
    setCurrentFileContent(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ✅ DÜZELTILMIŞ handleSend — artık /api/chat backend'ini kullanıyor
  const handleSend = async (textOverride?: string) => {
    const finalInput = textOverride || input;
    if (!finalInput.trim() && !currentFileContent) return;

    if (showHero) setShowHero(false);

    const userMsg: Message = {
      role: 'user',
      content: finalInput,
      fileName: currentFile?.name,
      fileSize: currentFile ? formatFileSize(currentFile.size) : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const fullPrompt = currentFileContent
      ? `${finalInput}\n\n[Yüklenen Dosya: ${currentFile?.name}]\n\n${currentFileContent}`
      : finalInput;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullPrompt,
          systemInstruction: SYSTEM_INSTRUCTION,
          history: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Sunucu hatası: ${response.status} — ${errText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        accumulatedText += text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: accumulatedText
          };
          return newMessages;
        });
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error("API Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ **Hata:** ${error.message || "Analiz sırasında bir hata oluştu."}` }]);
      setIsLoading(false);
    } finally {
      removeFile();
    }
  };

  const quickFill = (text: string) => {
    handleSend(text);
  };

  return (
    <div 
      className="max-w-[1000px] mx-auto px-5 md:px-10 flex flex-col min-h-screen relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-[var(--accent)]/10 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[var(--card-bg)] border-2 border-dashed border-[var(--accent)] p-12 rounded-3xl flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <FileDown size={40} />
              </div>
              <p className="text-xl font-serif font-bold">Dosyayı Buraya Bırakın</p>
              <p className="text-[var(--text-sec)]">PDF, DOCX veya TXT analiz için hazır.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="py-10 grid grid-cols-3 items-center sticky top-0 z-50 bg-transparent backdrop-blur-sm">
        <div className="logo cursor-pointer justify-self-start" onClick={() => setView('chat')}>
          <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-[var(--text)] to-[var(--accent)] bg-clip-text text-transparent">
            Satır Arası
          </h1>
        </div>
        
        <nav className="justify-self-center">
          <button 
            onClick={() => setView('about')}
            className={cn(
              "text-[11px] uppercase tracking-widest font-medium transition-colors hover:text-[var(--accent)]",
              view === 'about' ? "text-[var(--accent)]" : "text-[var(--text-sec)]"
            )}
          >
            Hakkımızda
          </button>
        </nav>

        <div className="flex items-center gap-4 justify-self-end">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-200 transform hover:rotate-180"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col h-full"
            >
              <AnimatePresence>
                {showHero && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    id="hero" 
                    className="text-center my-14"
                  >
                    <h2 className="font-serif text-4xl md:text-5xl mb-4 font-bold">Hukuki Analizin Geleceği</h2>
                    <p className="text-[var(--text-sec)] text-lg mb-10">Sözleşmelerdeki gizli riskleri ve kazanımları saniyeler içinde keşfedin.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                      <QuickCard 
                        icon={<FileText size={32} strokeWidth={1} />} 
                        title="Kira Tahliye Kontrolü" 
                        onClick={() => quickFill('Kira sözleşmemdeki tahliye şartlarını analiz et.')} 
                      />
                      <QuickCard 
                        icon={<Briefcase size={32} strokeWidth={1} />} 
                        title="Rekabet Yasağı Analizi" 
                        onClick={() => quickFill('Bir iş sözleşmesindeki rekabet yasağı maddesinin ağır sayılması için hangi kriterler aranır? Türk Borçlar Kanunu çerçevesinde açıkla.')} 
                      />
                      <QuickCard 
                        icon={<ShieldCheck size={32} strokeWidth={1} />} 
                        title="Cezai Şart İncelemesi" 
                        onClick={() => quickFill('Hizmet sözleşmesinde gizlilik ihlali cezası ne kadar?')} 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div id="chat-flow" className="pb-48">
                {messages.map((msg, idx) => (
                  <MessageItem key={idx} message={msg} />
                ))}
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="msg assistant mb-14"
                  >
                    <motion.span 
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-[11px] font-bold uppercase tracking-[1.5px] mb-4 block text-[var(--accent)]"
                    >
                      ANALİZ EDİLİYOR...
                    </motion.span>
                    <div className="space-y-3">
                      <motion.div 
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-4 bg-[var(--border)] rounded w-3/4"
                      ></motion.div>
                      <motion.div 
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="h-4 bg-[var(--border)] rounded w-1/2"
                      ></motion.div>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-10 max-w-3xl mx-auto"
            >
              <div className="mb-16">
                <span className="text-[11px] font-bold uppercase tracking-[3px] text-[var(--accent)] mb-4 block">
                  Hakkımızda
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold mb-8">Satır Arası Sözleşme Analiz Uzmanı</h2>
              </div>

              <section className="mb-20">
                <h3 className="font-serif text-2xl font-bold mb-6">Bizi Tanıyın: Satır Arası</h3>
                <div className="space-y-6 text-[var(--text-sec)] leading-relaxed text-lg">
                  <p>Ankara merkezli butik bir hukuk bürosu olan Özuğur & Savran bünyesinde, müvekkillerimizin karmaşık sözleşme metinleri arasında kaybolduğunu fark ederek yola çıktık. Başlangıçta amacımız, hukuki belgelerdeki riskleri geleneksel yöntemlerle minimize etmekti. Ancak kısa sürede gördük ki; günümüzün hızında müvekkillerimizin sadece bir "avukat görüşüne" değil, satır aralarındaki gizli riskleri anında görebilecekleri, şeffaf ve erişilebilir bir teknolojiye ihtiyacı var.</p>
                  <p>Bugün Satır Arası, yapay zeka ve hukuk uzmanlığını bir araya getirerek sözleşme analizi, risk tespiti ve mevzuat uyumu süreçlerini saniyelere indiriyor. Tıpkı hukuk pratiğimizde olduğe gibi, burada da "sessiz lüks" felsefesini benimsiyoruz: Gösterişten uzak, stratejik, keskin ve sonuç odaklı. Karmaşık hukuki süreçleri sizin için en sorunsuz ve zahmetsiz hale getirmek, satır aralarındaki belirsizlikleri güvene dönüştürmek için buradayız.</p>
                </div>
              </section>

              <section className="mb-20">
                <h3 className="font-serif text-2xl font-bold mb-6">Misyonumuz</h3>
                <p className="text-[var(--text-sec)] leading-relaxed text-lg">Sözleşme süreçlerinin işleyiş biçimini temelden değiştirmeyi hedefliyoruz. Sadece hukuki bir görüş sunmanın ötesine geçerek; teknolojiyi, derin hukuk tecrübemizi ve stratejik analizi tek bir platformda birleştiriyoruz. Amacımız, kullanıcılarımızın "Acaba bir maddeyi kaçırdım mı?" endişesini ortadan kaldırarak; zamanlarına, bütçelerine ve ticari hedeflerine en uygun güvenli limanı bulmalarını sağlamak. Karmaşayı değil, berraklığı sunuyoruz.</p>
              </section>

              <section className="mb-20">
                <h3 className="font-serif text-2xl font-bold mb-6">Vizyonumuz</h3>
                <p className="text-[var(--text-sec)] leading-relaxed text-lg">Hukuki süreçlerin bir "uzlaşma veya risk alma" zorunluluğu olmaktan çıktığı, herkesin kendi haklarını tam olarak bilerek adım attığı bir dünya hayal ediyoruz. Kimsenin "en kötü ihtimali" kabullenerek belirsizliğe imza atmak zorunda kalmadığı bir dijital hukuk ekosistemi inşa ediyoruz. Bu yüzden, teknolojik altyapımızı geliştirirken her bir algoritmayı, bir avukatın titizliği ve bir müvekkilin hassasiyetiyle işliyoruz. Bizim için başarı, kullanıcımızın satır aralarında hiçbir soru işareti kalmadığı andır.</p>
              </section>

              <section className="mb-20">
                <h3 className="font-serif text-2xl font-bold mb-10">Ekibimiz</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                  <div>
                    <h4 className="font-serif text-xl font-bold mb-2">Eda Özuğur</h4>
                    <p className="text-[var(--accent)] text-xs uppercase tracking-widest font-semibold mb-4">Avukat - Kurucu</p>
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold mb-2">Hayri Efe Savran</h4>
                    <p className="text-[var(--accent)] text-xs uppercase tracking-widest font-semibold mb-4">Avukat - Kurucu</p>
                  </div>
                </div>
                <div className="mt-12 text-[var(--text-sec)] leading-relaxed">
                  <p>Gücümüz, uzmanlık alanlarımızdaki çeşitlilikten ve ortak vizyonumuzdan geliyor. Av. Eda Özuğur ve Av. Hayri Efe Savran tarafından kurulan ekibimiz; şirketler hukuku, uluslararası sözleşme yönetimi ve teknoloji hukukuna odaklanan en iyi yetenekleri bir araya getirmeyi amaçlıyor. Dinamik hukukçu kadromuzu, yüksek yargı organlarından gelen onursal üyelerimizin tecrübesi ve akademisyenlerin bilimsel perspektifiyle destekliyoruz.</p>
                  <p className="mt-4">Ekibimiz; disiplinlerarası bir derinlikle, uyuşmazlıkları sadece yasal metinler üzerinden değil, stratejik bir mimariyle analiz eder. Satır Arası teknolojisinin arkasında, küresel standartlarda hukuk okuryazarlığını ve dijital dönüşümü savunan, çok dilli ve vizyoner bir çalışma kültürü yer almaktadır.</p>
                </div>
              </section>

              <footer className="pt-20 border-t border-[var(--border)] text-[var(--text-sec)] text-sm">
                <div className="mb-8">
                  <p>© 2025. All rights reserved.</p>
                  <p className="mt-2 opacity-60">Satır Arası v4.0</p>
                </div>
                <div className="space-y-4 leading-relaxed opacity-80">
                  <p>Satır Arası v4.0, bilginin paylaştıkça çoğaldığına ve toplumun her kesimine dokunması gerektiğine inanan bir vizyonla hayata geçti. Sadece bir içerik platformu olmanın ötesinde, toplumsal fayda sağlamayı amaçlayan bir sosyal sorumluluk köprüsü kuruyoruz.</p>
                  <p>Yürüttüğümüz projelerle, eğitimden dayanışmaya kadar pek çok alanda fark yaratmayı ve her "satır arasında" iyiliğe yer açmayı hedefliyoruz. Amacımız, sadece okunan değil, hayatın içinde aktif olarak fayda sağlayan, projeleriyle bireylerin gelişimine ve toplumsal bilince katkı sunan sürdürülebilir bir ekosistem oluşturmaktır.</p>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[1000]">
        <AnimatePresence>
          {currentFile && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border)] rounded-xl p-3 mb-3 flex items-center gap-3 shadow-lg"
            >
              <FileText className="text-[var(--accent)]" size={24} />
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-medium truncate">{currentFile.name}</div>
                <div className="text-xs text-[var(--text-sec)]">{formatFileSize(currentFile.size)}</div>
              </div>
              <button onClick={removeFile} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-3 flex items-end gap-3 shadow-2xl">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".pdf,.docx" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border-2 border-[var(--border)] flex items-center justify-center hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-200"
            title="PDF veya DOCX yükle"
          >
            <Paperclip size={20} />
          </button>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isMobile ? "Sözleşme analizi için başlayın." : "Bir sözleşme maddesi yapıştırın veya dosya yükleyin..."}
            className="flex-1 bg-transparent border-none outline-none text-base md:text-base py-2.5 px-1 resize-none max-h-48 placeholder:text-xs md:placeholder:text-base"
            rows={1}
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !currentFileContent)}
            className="bg-[var(--text)] text-[var(--bg)] w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-[var(--card-bg)] p-6 rounded-[20px] border border-[var(--border)] text-left backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl hover:border-[var(--accent)] transition-all duration-200 group"
    >
      <div className="text-[#A0A0A0] mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-[15px] font-semibold">{title}</h3>
    </button>
  );
}

function MessageItem({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';
  const label = isAssistant ? 'HUKUKİ ANALİZ RAPORU' : 'ANALİZ TALEBİ';
  
  const [copied, setCopied] = useState(false);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [cleanContent, setCleanContent] = useState(message.content);

  useEffect(() => {
    if (isAssistant) {
      let content = message.content;
      
      // Remove risk score
      const riskMatch = content.match(/\[RISK:\s*(\d+)\]/);
      if (riskMatch) {
        setRiskScore(parseInt(riskMatch[1]));
        content = content.replace(/\[RISK:\s*\d+\]/, '').trim();
      }

      // Aggressive cleaning of technical slop (JSON, code blocks)
      // If content starts with ```json or { and ends with } or ```
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\w*\s*/, '').replace(/\s*```$/, '');
      }

      // If it looks like JSON, try to extract the text if possible, or just leave it
      // But based on user request, they want to avoid technical characters.
      // We'll normalize newlines and remove literal \n strings if they appear as text
      content = content.replace(/\\n/g, '\n');
      
      setCleanContent(content.replace(/\n{3,}/g, '\n\n'));
    }
  }, [message, isAssistant]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = async () => {
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '-9999px';
    printContainer.style.width = '700px';
    printContainer.style.padding = '40px';
    printContainer.style.backgroundColor = 'white';
    printContainer.style.color = 'black';
    printContainer.style.fontFamily = '"Inter", sans-serif';
    printContainer.style.fontSize = '12pt';
    printContainer.style.lineHeight = '1.6';
    printContainer.style.color = '#1d1d1f';

    printContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0071e3; padding-bottom: 20px;">
        <h1 style="font-family: 'Playfair Display', serif; font-size: 24pt; margin-bottom: 10px; color: #1d1d1f;">Satır Arası Hukuki Analiz Raporu</h1>
        <p style="font-size: 10pt; color: #6e6e73; text-transform: uppercase; letter-spacing: 1px;">${new Date().toLocaleString('tr-TR')}</p>
      </div>
      ${riskScore !== null ? `
        <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fb; border-radius: 15px; border: 1px solid #eee;">
          <div style="font-weight: bold; font-size: 11pt; color: #6e6e73; margin-bottom: 10px;">SÖZLEŞME RİSK SKORU</div>
          <div style="font-size: 24pt; font-weight: bold; color: ${riskColor};">%${riskScore}</div>
        </div>
      ` : ''}
      <div style="white-space: pre-wrap; text-align: justify;">${cleanContent}</div>
      <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-style: italic; font-size: 9pt; color: #666;">
        Yasal Uyarı: Bu analiz bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz.
        Bağlayıcı karar öncesinde bir avukattan profesyonel destek almanız önerilir.
      </div>
    `;

    document.body.appendChild(printContainer);

    try {
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Satir_Arasi_Analiz_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      document.body.removeChild(printContainer);
    }
  };

  const downloadWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Satır Arası Hukuki Analiz Raporu",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: new Date().toLocaleString('tr-TR'),
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          ...(riskScore !== null ? [
            new Paragraph({
              children: [
                new TextRun({ text: `Sözleşme Risk Skoru: %${riskScore}`, bold: true })
              ],
            }),
            new Paragraph({ text: "" }),
          ] : []),
          ...cleanContent.split(/\n\n+/).map(paragraph => 
            new Paragraph({
              children: [new TextRun(paragraph.replace(/\n/g, ' '))],
              spacing: { before: 200, after: 200 },
              alignment: AlignmentType.JUSTIFIED
            })
          ),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "Yasal Uyarı: Bu analiz bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz.",
                italics: true,
                size: 18
              })
            ],
          })
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Satir_Arasi_Analiz_${new Date().getTime()}.docx`);
  };

  const riskColor = riskScore !== null 
    ? (riskScore < 30 ? '#34c759' : (riskScore < 70 ? '#ffcc00' : '#ff3b30'))
    : '';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-14 group"
    >
      <span className="text-[11px] font-bold uppercase tracking-[1.5px] mb-4 block text-[var(--accent)]">
        {label}
      </span>

      {riskScore !== null && (
        <div className="mb-5 p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)]">
          <div className="flex justify-between font-semibold text-sm mb-2">
            <span>Sözleşme Risk Skoru</span>
            <span>%{riskScore}</span>
          </div>
          <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${riskScore}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: riskColor }}
            />
          </div>
        </div>
      )}

      <div className={cn("text-lg leading-relaxed font-normal", !isAssistant && "whitespace-pre-wrap")}>
        {isAssistant ? (
          <div className="markdown-body p-6 md:p-10 bg-[var(--card-bg)] border border-[var(--border)] rounded-[32px] shadow-sm backdrop-blur-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{cleanContent}</ReactMarkdown>
          </div>
        ) : (
          <>
            {message.content}
            {message.fileName && (
              <div className="inline-flex items-center gap-2 py-2 px-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg mt-3">
                <FileText size={16} />
                <span className="text-sm font-medium">{message.fileName}</span>
                <span className="text-xs text-[var(--text-sec)]">({message.fileSize})</span>
              </div>
            )}
          </>
        )}
      </div>

      {isAssistant && (
        <div className="flex flex-wrap gap-3 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionButton onClick={copyToClipboard} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </ActionButton>
          <ActionButton onClick={handlePrint} icon={<Printer size={14} />}>
            Yazdır
          </ActionButton>
          <ActionButton onClick={downloadPDF} icon={<Download size={14} />}>
            PDF İndir
          </ActionButton>
          <ActionButton onClick={downloadWord} icon={<FileDown size={14} />}>
            Word İndir
          </ActionButton>
        </div>
      )}
    </motion.div>
  );
}

function ActionButton({ children, onClick, icon }: { children: React.ReactNode, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className="py-1.5 px-3.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-sec)] text-xs flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    >
      {icon}
      {children}
    </button>
  );
}
