package com.example.backend_main.common.util;

// 기계 켜지자마자 실행하는 기능
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

// @Component : 스프링이 이 클래스를 관리하도록 빈으로 등록!
// 나중에 다른 서비스에서 @Autowired로 편하게 불러다 사용 가능
// @Component
public class Aes256Util {
    // ALGORITHM : 암호화 방식의 레시피 설정
    // AES : 알고리즘 이름
    // CBC : Cipher Block Chaining - 이전 암호화 결과가 다음 블록에 영향을 주는 모드
    // PKCS5Padding : 암호화는 고정된 크기(블록) 단위로 진행되는데, 데이터가 그 크기에 딱 맞지 않을 때 빈공간을 채워주는 방식
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    // AES의 블록 크기는 16바이트 고정
    private static final int IV_SIZE = 16;

    // 보안을 위해 외부 설정 파일에 적힌 키 값을 이 변수에 자동으로 넣어주기..
    // @Value("${encryption.aes256.key}")
    private String secretKey;

    // 스프링 자동 빈 등록용
    public Aes256Util() {}
    // 수동으로 열쇠를 꽂을 수 있는 생성자 만들기..!
    public Aes256Util(String secretKey) {
        this.secretKey = secretKey;
    }



    // 기계가 준비되자마자 실행되는 열쇠 검사원..!!
    @PostConstruct
    public void validateKey() {
        if (secretKey == null || secretKey.length() != 32) {
            throw new IllegalArgumentException("보안 경고: AES-256 열쇠는 반드시 32자여야 합니다! 현재 길이: "
                    + (secretKey == null ? 0 : secretKey.length()));
        }
    }

    // 데이터 암호화
    // 사용자의 소중한 개인 정보(이메일, 전화번호 등)를 해커가 읽을 수 없게
    // 마법의 금고에 넣어 잠그는 과정!
    public String encrypt(String plainText) throws Exception {
        // 0. [매번 새로운 랜덤 IV 생성] (BCrypt의 Salt와 같은 역할)
        // 똑같은 글자를 암호화해도 매번 결과가 다르게 나오게 하려면 랜덤한 값이 필요
        // BCrypt의 Salt와 똑같은 역할을 하는 IV(초기화 벡터)를 16칸(byte)로 만들기
        byte[] iv = new byte[IV_SIZE];
        // 아주 강력한 주사위를 굴려 16칸을 예측 불가능한 랜덤 숫자로 채우기
        new SecureRandom().nextBytes(iv);
        // 랜덤 숫자를 금고를 흔들 규칙으로 등록!
        // 첫 블록을 암호화할 때 필요한 초기화 벡터(IV). 키의 앞 16글자만 사용 (0, 16)
        // 안에 든 내용을 한 번 무작위로 섞어서 이중 보안 처리..
        // 기계에 열쇠를 꽃고 흔들기 규칙을 설정 -> 마지막에 잠금 모드로 작동해!라고 스위치 온!
        // IvParameterSpec : 자바 암호화 기계(Cipher)에게 첫 번째 데이터를 암호화할 때
        //      랜덤 규칙(iv)을 사용하라고 아려주기 위한 랜덤 데이터를 예쁘게 포장해놓은 도구..
        // --> 암호화 시작할 때 쓸 랜덤 숫자(iv)를 기계가 알아먹을 수 있는 규격(Spec)으로 만든 것.
        // CBC 모드는 앞의 암호화 결과가 뒤의 암호화에 영향을 주는 사슬 구조이지만,
        // 첫 번째 데이터는 앞에 참고할 암호가 없어서 임의의 랜덤 값인 IV를 첫 번째 데이터와 섞어주기 위해서
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        // 1. [기계(Cipher) 준비하기] - 암호화/복호화 전용 기계
        // 자바에게 AES 알고리즘과 블록들을 사슬처럼 엮는 CBC와 빈 공간은 PKCS5Padding 채운다고 선언!
        // ALGORITHM : 암호화 알고리즘과 동작 모드를 문자열로 지정
        // 즉, 어떤 암호화 방식으로. 어떤 모드로, 어떤 패딩을 쓸지 자바에게 알려주는 규칙 문자열
        // 브랜드의 기계인데, 블록을 사슬처럼 엮고(CBC), 빈 공간은 채워넣는(PKCS5Padding) 최신 모델!
        Cipher cipher = Cipher.getInstance(ALGORITHM);

        // 2. [진짜 열쇠 만들기] (properties 파일에 저장해둔 문자열 활용)
        // SecretKeySpec : 우리가 가진 문자열 키를 AES 알고리즘이 이해할 수 있는 진짜 키 객체로 변환
        // UTF_8 : 공통 번역기 - 문자를 바이트 숫자로 인코딩하는 방식 - 표준 번역기를 돌려 숫자로 변경 후
        // AES : 금고 브랜드 - 암호화 알고리즘 규격 - AES 금고에 딱 맞는 가상이 아닌 실물 열쇠 객체로 변환..!
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");

        // 3. [기계 잠금모드] 설정하기
        // keySpec : 열쇠
        // ivSpec : 섞는 규칙
        // ENCRYPT_MODE : 잠금 모드
        // 기계에 [열쇠(keySpec)]를 꽂고 [랜덤 규칙(ivSpec)]을 설정한 뒤,
        // "지금부터는 잠그는 모드(ENCRYPT_MODE)야!"라고 스위치를 올립니다.
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);

        // 4. [실제로 잠금 모드 실행하기]
        // 실제로 암호화를 수행하여 바이너리(byte 배열) 데이터를 만들기!!
        // plainText : 사용자가 입력한 진짜 정보
        // 정보를 컴퓨터 숫자로 바꾼 뒤 기계에 넣고 최종 결과물을 뽑아내기 - 데이터 덩어리로 변해서 나옴
        // 즉, 기계가 내부적으로 데이터를 쪼개고 섞어서 사람이 읽을 수 없는 데이터 덩어리( byte [] )로 뱉어내기
        byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));


        // 5.[가장 중요]..!! 복호화를 위해서는 어떻게 흔들었는지(IV)를 알아야 하기 때문에
        // 암호화된 결과(데이터 덩어리)는 사람이 읽을 수 없는 깨진 글자 형태로
        // 이를 DB에 저장 및 통신하기 좋게 읽을 수 있는 문자열로 변환(인코딩)
        // 흔들기 규칙 + 암호 데이터를 하나로 합친 뒤, DB에 저장하거나,
        // 전송하기 좋게 '읽을 수 있는 문자열(Base64)로 예쁘게 포장해서 보내기
        // ByteBuffer : 데이터를 담는 임시 바구니 - 내용물을 담을 수 있는 딱 맞는 크기의 바구니 준비하기
        // allocate : 공간을 할당(예약)한다
        // 랜덤 규칙의 길이(16바이트)와 암호 내용(encrypted)의 길이를 합친 만큼의 공간을 정확히 예약하기
        ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encrypted.length);
        // 바구니의 맨 앞부분에 흔들기 규칙(iv)를 적용!
        // 나중에 암호를 풀 때(복호화), 맨 앞칸은 iv인 것을 알고 바로 꺼내 쓸 수 있도록 약속된 위치에 넣어두기
        byteBuffer.put(iv);
        // iv다음에는 진짜 암호화된 내용을 이어서 넣기 = iv바로 뒤에 실제 암호문이 붙어있어, 하나의 긴 데이터 덩어리 형태
        byteBuffer.put(encrypted);
        // 바구니에 담긴 덩어리를 안전항 택배 상자(Base64)로 포장해서 문자열로 보내라는 뜻!
        // Base64.getEncoder() : 깨진 글자처럼 보이는 데이터를 영어와 숫자로만 이루어진 안전한 텍스트로 변환
        // encodeToString(...) : 최종적으로 내부 덩어리를 우리가 DB에 저장하거나 화면에 보여줄 수 있는 
        //                       String(문자열) 형태로 변환하여 돌려주기
        // byteBuffer.array() : 바구니 안에 담긴 모든 데이터(IV + 암호문)으 꺼내어 하나의 덩어리로 만들기
        return Base64.getEncoder().encodeToString(byteBuffer.array());
    }

    // 데이터 복호화 : 암호화된 박스를 다시 열어 원래 정보를 꺼내는 과정
    // cipherText(택배 상자) : 암호화해서 DB에 저장해두었던 문자열 
    public String decrypt(String cipherText) throws Exception {

        // 1. [포장 뜯기]
        // 영어와 숫자로 예쁘게 포장된 문자열(Base64)을 다시 원래의 데이터 덩어리(byte[])로 되돌립니다.
        // 이 덩어리 안에는 [랜덤 규칙(16칸) + 진짜 암호 데이터]가 합쳐져 있습니다.
        // Base64.getDecoder() : Base64라는 특수 포장을 뜯을 수 있는 전용 해독 도구를 가져오기
        // decode(cipherText) : 도구(Decoder)를 사용해 포장을 뜯는 행위
        //                      텍스트 --> 이진수(바이너리)데이터로 되돌리기
        // byte[] : 숫자로만 되어 있는 데이터 배열 바구니
        byte[] combined = Base64.getDecoder().decode(cipherText);

        // 2. [흔들기 규칙(IV) 꺼내기]
        // 바구니의 맨 앞 16칸을 쏙 뽑아냅니다.
        // 암호화할 때 "나중에 풀 때 보려고" 맨 앞에 넣어두었던 바로 그 랜덤 규칙입니다!
        // 설명서(IV)만 따로 담을 작은 바구니를 만들기 = 16칸짜리 빈 바구니 객체..
        byte[] iv = new byte[IV_SIZE];
        // 큰 뭉치(combined)의 맨 앞부터 16개를 잘르고, 방금 만든 작은 바구니에 복사하기
        // 0번째부터 16개만큼 복사!!!
        // System.arraycopy(원본, 어디부터, 복사본, 어디에, 몇개나)
        System.arraycopy(combined, 0, iv, 0, iv.length);
        // 뽑아낸 랜덤 규칙을 등록!
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        // 3. [진짜 암호 데이터 분리하기]
        // 전체 덩어리에서 앞의 16칸(IV)을 제외한 나머지 뒷부분이 진짜 암호 내용입니다.
        // combined(전체 덩어리)의 길이 - IV_SIZE(16) : 암호의 길이 확인하기.
        int encryptedSize = combined.length - IV_SIZE;
        // 방금 계산한 길이만큼 크기가 딱 맞는 주머니 준비하기
        byte[] encryptedValue = new byte[encryptedSize];
        // 16번째부터 끝까지 복사
        // combined의 앞 16칸은 이미 IV로 가져갔기 때문에, 처음 위치(16부터) ~ encryptedSize 만큼 복사해오기
        // System.arraycopy(원본, 어디부터, 복사본, 어디에, 몇개나)
        System.arraycopy(combined, IV_SIZE, encryptedValue, 0, encryptedSize);

        // 4. [해독기 준비]
        // 암호화 때와 동일한 브랜드(AES)의 해독 기계를 가져옵니다.
        Cipher cipher = Cipher.getInstance(ALGORITHM);

        // 5. [열쇠 준비]
        // 우리가 properties에 숨겨둔 그 진짜 실물 열쇠를 깎아서 준비합니다.
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");

        // 6. [기계 가동 설정]
        // 기계에 [열쇠(keySpec)]를 꽂고, 방금 데이터에서 뽑아낸 [랜덤 규칙(ivSpec)]을 알려줍니다.
        // 그리고 "지금부터는 '열기 모드(DECRYPT_MODE)'야!"라고 명령합니다.
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);

        // 7. [문 열기]
        // 분리해두었던 진짜 암호 데이터를 기계에 넣고 버튼을 누르면 원래의 글자 숫자가 나옵니다.
        // 암호화된 데이터 덩어리가 기계를 통과 = 다시 원래의 데이터 조각(바이트)로 돌아옴
        byte[] decrypted = cipher.doFinal(encryptedValue);

        // 8. [편지 읽기]
        // 숫자로 된 데이터를 우리가 읽을 수 있는 한국어/영어 문장으로 변환해서 보여줍니다.
        return new String(decrypted, StandardCharsets.UTF_8);
    }





}